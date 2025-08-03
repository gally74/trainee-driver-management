'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useDriverStore } from '@/store/driverStore';
import { RosterEntry } from '@/types';
import { detectRouteType } from '@/utils/routeDetection';
import { exportWeeklyRosterPDF, exportTrainingReportPDF, exportDriverHistoryPDF, getAvailableWeeklyRosters } from '@/utils/pdfExport';
import { ArrowLeft, Plus, Calendar, Clock, MapPin, Download, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function RosterPageContent() {
  const searchParams = useSearchParams();
  const driverId = searchParams.get('id') as string;
  const { getDriver, getRosterEntriesForDriver, addRosterEntry, updateRosterEntry, deleteRosterEntry, getDriverProgress } = useDriverStore();
  
  const driver = getDriver(driverId);
  const rosterEntries = getRosterEntriesForDriver(driverId);
  const progress = getDriverProgress(driverId);
  
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showEditEntry, setShowEditEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RosterEntry | null>(null);
  const [showProgressUpdate, setShowProgressUpdate] = useState(false);
  const [showWeeklyRosterSelector, setShowWeeklyRosterSelector] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    duties: '',
    bookOnTime: '',
    bookOffTime: ''
  });

  if (!driver) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Driver Not Found</h1>
          <Link href="/" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const calculateHours = (bookOnTime: string, bookOffTime: string): number => {
    if (!bookOnTime || !bookOffTime) return 0;
    
    const parseTime = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours + minutes / 60;
    };
    
    const startTime = parseTime(bookOnTime);
    const endTime = parseTime(bookOffTime);
    
    // Handle overnight shifts
    if (endTime < startTime) {
      return (24 - startTime) + endTime;
    }
    
    return endTime - startTime;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const routeDetection = detectRouteType(formData.duties);
    const calculatedHours = calculateHours(formData.bookOnTime, formData.bookOffTime);
    
    // Create route segment based on detected route type
    const routeSegment = {
      route: formData.duties,
      routeType: routeDetection.routeType,
      isMainline: routeDetection.isMainline,
      isPilot: routeDetection.isPilot,
      isCorkEast: routeDetection.isCorkEast,
      isTralee: routeDetection.isTralee,
      drivingHours: Math.floor(calculatedHours),
      drivingMinutes: Math.round((calculatedHours % 1) * 60),
      description: formData.duties
    };
    
    addRosterEntry({
      driverId,
      date: formData.date,
      duties: formData.duties,
      bookOnTime: formData.bookOnTime,
      bookOffTime: formData.bookOffTime,
      routeSegments: [routeSegment],
      totalDrivingHours: Math.floor(calculatedHours),
      totalDrivingMinutes: Math.round((calculatedHours % 1) * 60)
    });

    setFormData({
      date: '',
      duties: '',
      bookOnTime: '',
      bookOffTime: ''
    });
    setShowAddEntry(false);
  };

  const handleEditEntry = (entry: RosterEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      duties: entry.duties,
      bookOnTime: entry.bookOnTime || '',
      bookOffTime: entry.bookOffTime || ''
    });
    setShowEditEntry(true);
  };

  const handleUpdateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingEntry) return;
    
    const routeDetection = detectRouteType(formData.duties);
    const calculatedHours = calculateHours(formData.bookOnTime, formData.bookOffTime);
    
    // Create route segment based on detected route type
    const routeSegment = {
      route: formData.duties,
      routeType: routeDetection.routeType,
      isMainline: routeDetection.isMainline,
      isPilot: routeDetection.isPilot,
      isCorkEast: routeDetection.isCorkEast,
      isTralee: routeDetection.isTralee,
      drivingHours: Math.floor(calculatedHours),
      drivingMinutes: Math.round((calculatedHours % 1) * 60),
      description: formData.duties
    };
    
    updateRosterEntry(editingEntry.id, {
      ...editingEntry,
      date: formData.date,
      duties: formData.duties,
      bookOnTime: formData.bookOnTime,
      bookOffTime: formData.bookOffTime,
      routeSegments: [routeSegment],
      totalDrivingHours: Math.floor(calculatedHours),
      totalDrivingMinutes: Math.round((calculatedHours % 1) * 60)
    });

    setFormData({
      date: '',
      duties: '',
      bookOnTime: '',
      bookOffTime: ''
    });
    setShowEditEntry(false);
    setEditingEntry(null);
  };

  const handleDeleteEntry = (entryId: string) => {
    if (confirm('Are you sure you want to delete this roster entry?')) {
      deleteRosterEntry(entryId);
    }
  };

  const handleDateChange = (date: string) => {
    setFormData(prev => ({ ...prev, date }));
  };

  const getRouteTypeColor = (routeType: string) => {
    switch (routeType) {
      case 'mainline': return 'bg-blue-100 text-blue-800';
      case 'pilot': return 'bg-green-100 text-green-800';
      case 'cork-east': return 'bg-purple-100 text-purple-800';
      case 'tralee': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExportWeeklyRoster = () => {
    if (rosterEntries.length === 0) {
      alert('No roster entries to export');
      return;
    }

    // Show weekly roster selector
    setShowWeeklyRosterSelector(true);
  };

  const handleExportSpecificWeeklyRoster = (weekEnding: string) => {
    // Get entries for the specific week
    const weekStart = new Date(weekEnding);
    weekStart.setDate(weekStart.getDate() - 6); // Monday
    
    const weekEntries = rosterEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekStart && entryDate <= new Date(weekEnding);
    });

    const doc = exportWeeklyRosterPDF(driver, weekEntries, weekEnding);
    doc.save(`${driver.name}-weekly-roster-${weekEnding}.pdf`);
    setShowWeeklyRosterSelector(false);
  };

  const handleExportTrainingReport = () => {
    if (!progress) {
      alert('No training progress data available');
      return;
    }
    const doc = exportTrainingReportPDF(driver, progress, rosterEntries);
    doc.save(`${driver.name}-training-report.pdf`);
  };

  const handleExportDriverHistory = () => {
    if (!progress) {
      alert('No training progress data available');
      return;
    }
    const doc = exportDriverHistoryPDF(driver, progress, rosterEntries);
    doc.save(`${driver.name}-training-history.pdf`);
  };

  // Calculate stats
  const totalEntries = rosterEntries.length;
  const totalHours = rosterEntries.reduce((sum, entry) => sum + entry.totalDrivingHours, 0);
  const totalMinutes = rosterEntries.reduce((sum, entry) => sum + entry.totalDrivingMinutes, 0);
  const totalHoursFormatted = totalHours + Math.floor(totalMinutes / 60);
  const totalMinutesFormatted = totalMinutes % 60;

  const mainlineEntries = rosterEntries.filter(entry => 
    entry.routeSegments.some(segment => segment.isMainline)
  ).length;
  const pilotEntries = rosterEntries.filter(entry => 
    entry.routeSegments.some(segment => segment.isPilot)
  ).length;
  const corkEastEntries = rosterEntries.filter(entry => 
    entry.routeSegments.some(segment => segment.isCorkEast)
  ).length;
  const traleeEntries = rosterEntries.filter(entry => 
    entry.routeSegments.some(segment => segment.isTralee)
  ).length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {driver.name} - Weekly Roster
            </h1>
            <p className="text-gray-600">
              Manage weekly roster entries and training progress
            </p>
          </div>
          <button
            onClick={() => setShowAddEntry(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900">{totalEntries}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalHoursFormatted}h {totalMinutesFormatted}m
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Mainline Days</p>
              <p className="text-2xl font-bold text-gray-900">{mainlineEntries}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Other Routes</p>
              <p className="text-2xl font-bold text-gray-900">{pilotEntries + corkEastEntries + traleeEntries}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      {progress && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Training Progress</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Training Days</span>
                <span className="font-medium">{progress.traineeDaysCompleted}/70</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-primary-600 transition-all duration-300"
                  style={{ width: `${(progress.traineeDaysCompleted / 70) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Mainline Days</span>
                <span className="font-medium">{progress.mainlineDaysCompleted}/56</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${(progress.mainlineDaysCompleted / 56) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Training Hours</span>
                <span className="font-medium">{Math.round(progress.traineeHoursCompleted)}/250</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-green-600 transition-all duration-300"
                  style={{ width: `${(progress.traineeHoursCompleted / 250) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Options</h2>
        
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handleExportWeeklyRoster}
            className="btn-secondary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Weekly Roster
          </button>
          
          <button 
            onClick={handleExportTrainingReport}
            className="btn-secondary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Training Report
          </button>
          
          <button 
            onClick={handleExportDriverHistory}
            className="btn-secondary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Driver History
          </button>
        </div>
      </div>

      {/* Roster Entries */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Roster Entries</h2>
        
        {rosterEntries.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No roster entries yet</p>
            <button
              onClick={() => setShowAddEntry(true)}
              className="btn-primary"
            >
              Add First Entry
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {rosterEntries
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <span className="font-medium text-gray-900">
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                      <p className="text-sm text-gray-600">{entry.duties}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {entry.bookOnTime} - {entry.bookOffTime}
                      </p>
                      <p className="text-xs text-gray-600">
                        {entry.totalDrivingHours}h {entry.totalDrivingMinutes}m
                      </p>
                    </div>
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      entry.routeSegments.some(segment => segment.isMainline) ? 'bg-blue-100 text-blue-800' :
                      entry.routeSegments.some(segment => segment.isPilot) ? 'bg-green-100 text-green-800' :
                      entry.routeSegments.some(segment => segment.isCorkEast) ? 'bg-purple-100 text-purple-800' :
                      entry.routeSegments.some(segment => segment.isTralee) ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {entry.routeSegments.length > 0 ? entry.routeSegments[0].routeType : 'other'}
                    </span>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditEntry(entry)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add Entry Modal */}
      {showAddEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Roster Entry</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duties</label>
                <textarea
                  value={formData.duties}
                  onChange={(e) => setFormData(prev => ({ ...prev, duties: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Describe the duties for this day..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Book On Time</label>
                  <input
                    type="time"
                    value={formData.bookOnTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, bookOnTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Book Off Time</label>
                  <input
                    type="time"
                    value={formData.bookOffTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, bookOffTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Add Entry
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddEntry(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {showEditEntry && editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Roster Entry</h3>
            
            <form onSubmit={handleUpdateEntry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duties</label>
                <textarea
                  value={formData.duties}
                  onChange={(e) => setFormData(prev => ({ ...prev, duties: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Describe the duties for this day..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Book On Time</label>
                  <input
                    type="time"
                    value={formData.bookOnTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, bookOnTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Book Off Time</label>
                  <input
                    type="time"
                    value={formData.bookOffTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, bookOffTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Update Entry
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditEntry(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Weekly Roster Selector Modal */}
      {showWeeklyRosterSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Weekly Roster to Export</h3>
            
            <div className="space-y-3">
              {getAvailableWeeklyRosters(driver, rosterEntries).map((roster) => (
                <div
                  key={roster.weekEnding}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleExportSpecificWeeklyRoster(roster.weekEnding)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {roster.weekStart} - {roster.weekEnd}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {roster.entryCount} entries • {roster.totalHours.toFixed(1)} hours
                      </p>
                    </div>
                    <Download className="h-5 w-5 text-primary-600" />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setShowWeeklyRosterSelector(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RosterPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
        </div>
      </div>
    }>
      <RosterPageContent />
    </Suspense>
  );
} 