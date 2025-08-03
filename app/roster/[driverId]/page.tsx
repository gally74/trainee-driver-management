'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useDriverStore } from '@/store/driverStore';
import { RosterEntry } from '@/types';
import { detectRouteType } from '@/utils/routeDetection';
import { exportWeeklyRosterPDF, exportTrainingReportPDF, exportDriverHistoryPDF } from '@/utils/pdfExport';
import { ArrowLeft, Plus, Calendar, Clock, MapPin, Download, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';



export default function RosterPage() {
  const params = useParams();
  const driverId = params.driverId as string;
  const { getDriver, getRosterEntriesForDriver, addRosterEntry, updateRosterEntry, deleteRosterEntry, getDriverProgress } = useDriverStore();
  
  const driver = getDriver(driverId);
  const rosterEntries = getRosterEntriesForDriver(driverId);
  const progress = getDriverProgress(driverId);
  
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showEditEntry, setShowEditEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RosterEntry | null>(null);
  const [showProgressUpdate, setShowProgressUpdate] = useState(false);
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
    setShowEditEntry(true);
  };

  const handleUpdateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    const routeDetection = detectRouteType(editingEntry.duties);
    const calculatedHours = calculateHours(editingEntry.bookOnTime || '', editingEntry.bookOffTime || '');
    
    // Create updated route segment
    const routeSegment = {
      route: editingEntry.duties,
      routeType: routeDetection.routeType,
      isMainline: routeDetection.isMainline,
      isPilot: routeDetection.isPilot,
      isCorkEast: routeDetection.isCorkEast,
      isTralee: routeDetection.isTralee,
      drivingHours: Math.floor(calculatedHours),
      drivingMinutes: Math.round((calculatedHours % 1) * 60),
      description: editingEntry.duties
    };
    
    // Update the roster entry with new route detection and calculated hours
    updateRosterEntry(editingEntry.id, {
      date: editingEntry.date,
      duties: editingEntry.duties,
      bookOnTime: editingEntry.bookOnTime,
      bookOffTime: editingEntry.bookOffTime,
      routeSegments: [routeSegment],
      totalDrivingHours: Math.floor(calculatedHours),
      totalDrivingMinutes: Math.round((calculatedHours % 1) * 60)
    });

    // Force a re-render to update progress tracking
    setShowEditEntry(false);
    setEditingEntry(null);
    
    // Show progress update notification
    setShowProgressUpdate(true);
    setTimeout(() => setShowProgressUpdate(false), 3000);
  };

  const handleDeleteEntry = (entryId: string) => {
    if (confirm('Are you sure you want to delete this roster entry?')) {
      deleteRosterEntry(entryId);
    }
  };

  const handleDateChange = (date: string) => {
    const selectedDate = new Date(date);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[selectedDate.getDay()];
    
    setFormData(prev => ({
      ...prev,
      date,
      dayOfWeek
    }));
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
    if (!driver || !rosterEntries.length) return;
    
    // Get the most recent week's entries
    const sortedEntries = rosterEntries.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Calculate week ending for the most recent entry
    const latestDate = new Date(sortedEntries[0].date);
    const daysUntilSunday = 7 - latestDate.getDay();
    const weekEnding = new Date(latestDate);
    weekEnding.setDate(latestDate.getDate() + daysUntilSunday);
    const weekEndingStr = weekEnding.toISOString().split('T')[0];
    
    // Filter entries for the same week
    const weekEntries = rosterEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const entryWeekEnding = new Date(entryDate);
      const entryDaysUntilSunday = 7 - entryDate.getDay();
      entryWeekEnding.setDate(entryDate.getDate() + entryDaysUntilSunday);
      return entryWeekEnding.toISOString().split('T')[0] === weekEndingStr;
    });
    
    const doc = exportWeeklyRosterPDF(driver, weekEntries, weekEndingStr);
    doc.save(`${driver.name}-weekly-roster-${weekEndingStr}.pdf`);
  };

  const handleExportTrainingReport = () => {
    if (!driver || !progress) return;
    
    const doc = exportTrainingReportPDF(driver, progress, rosterEntries);
    doc.save(`${driver.name}-training-report.pdf`);
  };

  const handleExportDriverHistory = () => {
    if (!driver || !progress) return;
    
    const doc = exportDriverHistoryPDF(driver, progress, rosterEntries);
    doc.save(`${driver.name}-training-history.pdf`);
  };



  return (
    <div className="container mx-auto px-4 py-8">
      {/* Progress Update Notification */}
      {showProgressUpdate && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          <div className="flex items-center">
            <div className="mr-2">✅</div>
            <div>
              <div className="font-medium">Progress Updated!</div>
              <div className="text-sm opacity-90">Training progress has been recalculated</div>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Roster Management - {driver.name}
        </h1>
        <p className="text-gray-600">
          Add and manage weekly roster entries
        </p>
      </div>

             {/* Stats */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
         <div className="card">
           <div className="flex items-center">
             <Calendar className="h-6 w-6 text-primary-600" />
             <div className="ml-4">
               <p className="text-sm font-medium text-gray-600">Total Days</p>
               <p className="text-2xl font-bold text-gray-900">{rosterEntries.length}</p>
             </div>
           </div>
         </div>

         <div className="card">
           <div className="flex items-center">
             <MapPin className="h-6 w-6 text-blue-600" />
             <div className="ml-4">
               <p className="text-sm font-medium text-gray-600">Mainline Days</p>
               <p className="text-2xl font-bold text-gray-900">
                 {rosterEntries.filter(entry => entry.routeSegments.some(segment => segment.isMainline)).length}
               </p>
             </div>
           </div>
         </div>

         <div className="card">
           <div className="flex items-center">
             <Clock className="h-6 w-6 text-green-600" />
             <div className="ml-4">
               <p className="text-sm font-medium text-gray-600">Pilot Days</p>
               <p className="text-2xl font-bold text-gray-900">
                 {rosterEntries.filter(entry => entry.routeSegments.some(segment => segment.isPilot)).length}
               </p>
             </div>
           </div>
         </div>

         <div className="card">
           <div className="flex items-center">
             <MapPin className="h-6 w-6 text-purple-600" />
             <div className="ml-4">
               <p className="text-sm font-medium text-gray-600">Other Routes</p>
               <p className="text-2xl font-bold text-gray-900">
                 {rosterEntries.filter(entry => !entry.routeSegments.some(segment => segment.isMainline) && !entry.routeSegments.some(segment => segment.isPilot)).length}
               </p>
             </div>
           </div>
         </div>
       </div>

               {/* Overall Training Summary */}
        {progress && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Training Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                             <div className="card">
                 <div className="text-sm text-gray-600">Total Driving Hours</div>
                 <div className="text-2xl font-bold text-blue-600">
                   {(() => {
                     const hours = Math.floor(progress.traineeHoursCompleted);
                     const minutes = Math.round((progress.traineeHoursCompleted % 1) * 60);
                     return `${hours}h ${minutes}m`;
                   })()}
                 </div>
               </div>
              <div className="card">
                <div className="text-sm text-gray-600">Mainline Days</div>
                <div className="text-2xl font-bold text-green-600">
                  {progress.mainlineDaysCompleted}
                </div>
              </div>
              <div className="card">
                <div className="text-sm text-gray-600">Pilot Days</div>
                <div className="text-2xl font-bold text-purple-600">
                  {progress.pilotDaysCompleted}
                </div>
              </div>
              <div className="card">
                <div className="text-sm text-gray-600">Cork East Trips</div>
                <div className="text-2xl font-bold text-orange-600">
                  {progress.corkEastCobhTrips + progress.corkEastMidletonTrips}
                </div>
              </div>
            </div>
            
            {/* Detailed Progress Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Phase Information */}
              <div className="card">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Phase Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Current Phase:</span>
                    <span className="text-sm font-medium capitalize">{driver.currentPhase.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Training Days:</span>
                    <span className="text-sm font-medium">{progress.traineeDaysCompleted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tralee Learning Days:</span>
                    <span className="text-sm font-medium">{progress.traleeLearningDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cork East Cobh Trips:</span>
                    <span className="text-sm font-medium">{progress.corkEastCobhTrips}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cork East Midleton Trips:</span>
                    <span className="text-sm font-medium">{progress.corkEastMidletonTrips}</span>
                  </div>
                </div>
              </div>

              {/* Route Distribution */}
              <div className="card">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Route Distribution</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Mainline Routes</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${rosterEntries.length > 0 ? (rosterEntries.filter(entry => entry.routeSegments.some(segment => segment.isMainline)).length / rosterEntries.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{rosterEntries.filter(entry => entry.routeSegments.some(segment => segment.isMainline)).length}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pilot Duties</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${rosterEntries.length > 0 ? (rosterEntries.filter(entry => entry.routeSegments.some(segment => segment.isPilot)).length / rosterEntries.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{rosterEntries.filter(entry => entry.routeSegments.some(segment => segment.isPilot)).length}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cork East Routes</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full" 
                          style={{ width: `${rosterEntries.length > 0 ? (rosterEntries.filter(entry => entry.routeSegments.some(segment => segment.isCorkEast)).length / rosterEntries.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{rosterEntries.filter(entry => entry.routeSegments.some(segment => segment.isCorkEast)).length}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tralee Routes</span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${rosterEntries.length > 0 ? (rosterEntries.filter(entry => entry.routeSegments.some(segment => segment.isTralee)).length / rosterEntries.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{rosterEntries.filter(entry => entry.routeSegments.some(segment => segment.isTralee)).length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Training Timeline */}
            <div className="mt-6 card">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Training Timeline</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <div className="font-medium">Started Training</div>
                    <div className="text-gray-600">{new Date(driver.startDate).toLocaleDateString('en-GB')}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <div className="font-medium">Days Since Start</div>
                    <div className="text-gray-600">
                      {Math.floor((new Date().getTime() - new Date(driver.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                    </div>
                  </div>
                </div>
                                 <div className="flex items-center">
                   <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                   <div>
                     <div className="font-medium">Average Driving Hours/Day</div>
                     <div className="text-gray-600">
                       {(() => {
                         if (rosterEntries.length === 0) return '0h 0m';
                         const avgHours = progress.traineeHoursCompleted / rosterEntries.length;
                         const hours = Math.floor(avgHours);
                         const minutes = Math.round((avgHours % 1) * 60);
                         return `${hours}h ${minutes}m`;
                       })()}
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        )}

      {/* Actions */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Roster Entries</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleExportWeeklyRoster}
            disabled={rosterEntries.length === 0}
            className="btn-secondary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Weekly
          </button>
          <button
            onClick={handleExportTrainingReport}
            disabled={!progress}
            className="btn-secondary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
          <button
            onClick={handleExportDriverHistory}
            disabled={!progress}
            className="btn-secondary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export History
          </button>
          <button
            onClick={() => setShowAddEntry(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Roster Entries */}
      {rosterEntries.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No roster entries yet</h3>
          <p className="text-gray-600 mb-4">
            Start by adding your first roster entry
          </p>
          <button
            onClick={() => setShowAddEntry(true)}
            className="btn-primary"
          >
            Add First Entry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rosterEntries
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((entry) => (
              <div key={entry.id} className="card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="font-medium text-gray-900">
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(entry.date).toLocaleDateString('en-GB', { weekday: 'long' })}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRouteTypeColor(entry.routeSegments.length > 0 ? entry.routeSegments[0].routeType : 'other')}`}>
                        {entry.routeSegments.length > 0 ? entry.routeSegments[0].routeType : 'other'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span>Book On: {entry.bookOnTime}</span>
                      <span>Book Off: {entry.bookOffTime}</span>
                    </div>
                    <p className="text-gray-700">{entry.duties}</p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEditEntry(entry)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit entry"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Add Entry Modal */}
      {showAddEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Roster Entry</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Book On Time</label>
                <input
                  type="time"
                  value={formData.bookOnTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, bookOnTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Book Off Time</label>
                <input
                  type="time"
                  value={formData.bookOffTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, bookOffTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duties</label>
                <textarea
                  value={formData.duties}
                  onChange={(e) => setFormData(prev => ({ ...prev, duties: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="e.g., book on duty 04:45 Mallow travel 05:30 empty train Mallow to Tralee"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddEntry(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {showEditEntry && editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Roster Entry</h2>
            
                         <form onSubmit={handleUpdateEntry} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                 <input
                   type="date"
                   value={editingEntry.date}
                   onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                   required
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Book On Time</label>
                 <input
                   type="time"
                   value={editingEntry.bookOnTime || ''}
                   onChange={(e) => setEditingEntry({ ...editingEntry, bookOnTime: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                   required
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Book Off Time</label>
                 <input
                   type="time"
                   value={editingEntry.bookOffTime || ''}
                   onChange={(e) => setEditingEntry({ ...editingEntry, bookOffTime: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                   required
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Duties</label>
                 <textarea
                   value={editingEntry.duties}
                   onChange={(e) => setEditingEntry({ ...editingEntry, duties: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                   rows={3}
                   placeholder="e.g., 09:25 Cork to Dublin, Cobh line, Midleton line"
                   required
                 />
               </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditEntry(false);
                    setEditingEntry(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Update Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 