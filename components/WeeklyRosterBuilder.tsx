'use client';

import { useState } from 'react';
import { useDriverStore } from '@/store/driverStore';
import { X, Plus, Trash2, Download } from 'lucide-react';
import { exportWeeklyRosterPDF } from '@/utils/pdfExport';

interface WeeklyRosterBuilderProps {
  driverId: string;
  onClose: () => void;
}

interface RouteSegment {
  id: string;
  route: string;
  routeType: 'mainline' | 'pilot' | 'cork-east' | 'tralee' | 'other';
  isMainline: boolean;
  isPilot: boolean;
  isCorkEast: boolean;
  isTralee: boolean;
  drivingHours: number;
  drivingMinutes: number;
  description: string;
}

interface RosterDay {
  date: string;
  duties: string;
  bookOnTime: string;
  bookOffTime: string;
  routeSegments: RouteSegment[];
  dayType: 'work' | 'rest';
}

export function WeeklyRosterBuilder({ driverId, onClose }: WeeklyRosterBuilderProps) {
  const { getDriver, addRosterEntry } = useDriverStore();
  const driver = getDriver(driverId);
  const [weekStarting, setWeekStarting] = useState('');
  const [entries, setEntries] = useState<RosterDay[]>([]);
  const [weekError, setWeekError] = useState('');
  const [savedEntries, setSavedEntries] = useState<RosterDay[]>([]);
  const [showExportOptions, setShowExportOptions] = useState(false);

  if (!driver) return null;

  const isMonday = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDay() === 1; // 1 = Monday
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const formatDateUK = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDayColor = (index: number) => {
    const colors = [
      'bg-blue-50 border-blue-200', // Monday
      'bg-green-50 border-green-200', // Tuesday
      'bg-purple-50 border-purple-200', // Wednesday
      'bg-orange-50 border-orange-200', // Thursday
      'bg-pink-50 border-pink-200', // Friday
      'bg-indigo-50 border-indigo-200', // Saturday
      'bg-red-50 border-red-200', // Sunday
    ];
    return colors[index % colors.length];
  };

  const handleWeekStartingChange = (date: string) => {
    setWeekStarting(date);
    if (date && !isMonday(date)) {
      setWeekError('Week must start on a Monday. Please select a Monday date.');
    } else {
      setWeekError('');
    }
  };

  const addDay = () => {
    const newDay: RosterDay = {
      date: '',
      duties: '',
      bookOnTime: '',
      bookOffTime: '',
      routeSegments: [],
      dayType: 'work'
    };
    setEntries([...entries, newDay]);
  };

  const updateDay = (index: number, field: keyof RosterDay, value: any) => {
    const updatedEntries = [...entries];
    updatedEntries[index] = { ...updatedEntries[index], [field]: value };
    setEntries(updatedEntries);
  };

  const addRouteSegment = (dayIndex: number) => {
    const updatedEntries = [...entries];
    const newSegment: RouteSegment = {
      id: Date.now().toString(),
      route: '',
      routeType: 'mainline',
      isMainline: true,
      isPilot: false,
      isCorkEast: false,
      isTralee: false,
      drivingHours: 0,
      drivingMinutes: 0,
      description: ''
    };
    updatedEntries[dayIndex].routeSegments.push(newSegment);
    setEntries(updatedEntries);
  };

  const updateRouteSegment = (dayIndex: number, segmentIndex: number, field: keyof RouteSegment, value: any) => {
    const updatedEntries = [...entries];
    updatedEntries[dayIndex].routeSegments[segmentIndex] = { 
      ...updatedEntries[dayIndex].routeSegments[segmentIndex], 
      [field]: value 
    };
    
    // Update route type flags based on selected route
    if (field === 'route') {
      const route = value;
      if (route.includes('Cork-Dublin') || route.includes('Cork-Mallow')) {
        updatedEntries[dayIndex].routeSegments[segmentIndex].routeType = 'mainline';
        updatedEntries[dayIndex].routeSegments[segmentIndex].isMainline = true;
        updatedEntries[dayIndex].routeSegments[segmentIndex].isPilot = false;
        updatedEntries[dayIndex].routeSegments[segmentIndex].isCorkEast = false;
        updatedEntries[dayIndex].routeSegments[segmentIndex].isTralee = false;
      } else if (route.includes('Cork-Cobh') || route.includes('Cork-Midleton')) {
        updatedEntries[dayIndex].routeSegments[segmentIndex].routeType = 'cork-east';
        updatedEntries[dayIndex].routeSegments[segmentIndex].isMainline = false;
        updatedEntries[dayIndex].routeSegments[segmentIndex].isPilot = false;
        updatedEntries[dayIndex].routeSegments[segmentIndex].isCorkEast = true;
        updatedEntries[dayIndex].routeSegments[segmentIndex].isTralee = false;
      } else if (route.includes('Mallow-Tralee')) {
        updatedEntries[dayIndex].routeSegments[segmentIndex].routeType = 'tralee';
        updatedEntries[dayIndex].routeSegments[segmentIndex].isMainline = false;
        updatedEntries[dayIndex].routeSegments[segmentIndex].isPilot = false;
        updatedEntries[dayIndex].routeSegments[segmentIndex].isCorkEast = false;
        updatedEntries[dayIndex].routeSegments[segmentIndex].isTralee = true;
      } else if (route.includes('Pilots')) {
        updatedEntries[dayIndex].routeSegments[segmentIndex].routeType = 'pilot';
        updatedEntries[dayIndex].routeSegments[segmentIndex].isMainline = false;
        updatedEntries[dayIndex].routeSegments[segmentIndex].isPilot = true;
        updatedEntries[dayIndex].routeSegments[segmentIndex].isCorkEast = false;
        updatedEntries[dayIndex].routeSegments[segmentIndex].isTralee = false;
      }
    }
    
    setEntries(updatedEntries);
  };

  const removeRouteSegment = (dayIndex: number, segmentIndex: number) => {
    const updatedEntries = [...entries];
    updatedEntries[dayIndex].routeSegments.splice(segmentIndex, 1);
    setEntries(updatedEntries);
  };

  const removeDay = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const saveWeek = () => {
    // Check if week starts on Monday
    if (weekStarting && !isMonday(weekStarting)) {
      setWeekError('Week must start on a Monday. Please select a Monday date.');
      return;
    }

    const savedRosterEntries: any[] = [];

    entries.forEach(entry => {
      if (entry.date) {
        let dutiesText = '';
        if (entry.dayType === 'rest') {
          dutiesText = 'Rest Day - No Duties';
        } else if (entry.duties) {
          dutiesText = `${entry.bookOnTime} Book On - ${entry.duties} - ${entry.bookOffTime} Book Off`;
        }
        
        // Calculate total driving time
        const totalDrivingHours = entry.routeSegments.reduce((total, segment) => 
          total + segment.drivingHours + (segment.drivingMinutes / 60), 0);
        const totalDrivingMinutes = Math.round((totalDrivingHours % 1) * 60);
        const finalHours = Math.floor(totalDrivingHours);
        
        const rosterEntry = {
          driverId,
          date: entry.date,
          duties: dutiesText,
          bookOnTime: entry.bookOnTime,
          bookOffTime: entry.bookOffTime,
          routeSegments: entry.routeSegments,
          totalDrivingHours: finalHours,
          totalDrivingMinutes: totalDrivingMinutes
        };
        
        addRosterEntry(rosterEntry);
        savedRosterEntries.push(rosterEntry);
      }
    });
    
    setSavedEntries(entries);
    setShowExportOptions(true);
  };

  const exportPDF = () => {
    if (savedEntries.length === 0) return;
    
    const weekEnding = weekStarting ? new Date(weekStarting).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const doc = exportWeeklyRosterPDF(driver, savedEntries as any, weekEnding);
    doc.save(`roster_${driver.name}_${weekEnding}.pdf`);
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Weekly Roster Builder - {driver.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

                 <div className="mb-4">
           <label className="block text-sm font-medium text-gray-700 mb-1">
             Week Starting (Must be Monday)
           </label>
           <input
             type="date"
             value={weekStarting}
             onChange={(e) => handleWeekStartingChange(e.target.value)}
             className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
               weekError ? 'border-red-500' : 'border-gray-300'
             }`}
           />
           {weekError && (
             <p className="mt-1 text-sm text-red-600">{weekError}</p>
           )}
         </div>

        <div className="space-y-4 mb-6">
          {entries.map((entry, index) => (
            <div key={index} className={`border rounded-lg p-4 ${getDayColor(index)}`}>
                             <div className="flex justify-between items-center mb-3">
                 <h4 className="font-medium text-gray-900">
                   {entry.date ? `${getDayName(entry.date)} (${formatDateUK(entry.date)})` : `Day ${index + 1}`}
                 </h4>
                 <button
                   onClick={() => removeDay(index)}
                   className="text-red-500 hover:text-red-700"
                 >
                   <Trash2 className="h-4 w-4" />
                 </button>
               </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Date
                   </label>
                   <input
                     type="date"
                     value={entry.date}
                     onChange={(e) => updateDay(index, 'date', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Day Type
                   </label>
                   <select
                     value={entry.dayType}
                     onChange={(e) => updateDay(index, 'dayType', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                   >
                     <option value="work">Work Day</option>
                     <option value="rest">Rest Day</option>
                   </select>
                 </div>
               </div>

               {entry.dayType === 'work' && (
                 <>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         Book On Time
                       </label>
                       <input
                         type="time"
                         value={entry.bookOnTime}
                         onChange={(e) => updateDay(index, 'bookOnTime', e.target.value)}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                       />
                     </div>

                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         Book Off Time
                       </label>
                       <input
                         type="time"
                         value={entry.bookOffTime}
                         onChange={(e) => updateDay(index, 'bookOffTime', e.target.value)}
                         className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                       />
                     </div>
                   </div>

                   {/* Route Segments */}
                   <div className="mt-4">
                     <div className="flex justify-between items-center mb-2">
                       <label className="block text-sm font-medium text-gray-700">
                         Route Segments
                       </label>
                       <button
                         type="button"
                         onClick={() => addRouteSegment(index)}
                         className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                       >
                         <Plus className="h-4 w-4 mr-1" />
                         Add Route
                       </button>
                     </div>
                     
                     {entry.routeSegments.length === 0 && (
                       <p className="text-sm text-gray-500 italic">No routes added yet. Click "Add Route" to add route segments.</p>
                     )}
                     
                     {entry.routeSegments.map((segment, segmentIndex) => (
                       <div key={segment.id} className="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50">
                         <div className="flex justify-between items-start mb-3">
                           <h5 className="font-medium text-gray-900">Route {segmentIndex + 1}</h5>
                           <button
                             type="button"
                             onClick={() => removeRouteSegment(index, segmentIndex)}
                             className="text-red-500 hover:text-red-700"
                           >
                             <Trash2 className="h-4 w-4" />
                           </button>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">
                               Route
                             </label>
                             <select
                               value={segment.route}
                               onChange={(e) => updateRouteSegment(index, segmentIndex, 'route', e.target.value)}
                               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                             >
                               <option value="">Select a route</option>
                               <option value="Cork-Dublin">Cork-Dublin (Mainline)</option>
                               <option value="Cork-Mallow">Cork-Mallow (Mainline)</option>
                               <option value="Cork-Cobh">Cork-Cobh (Cork East)</option>
                               <option value="Cork-Midleton">Cork-Midleton (Cork East)</option>
                               <option value="Mallow-Tralee">Mallow-Tralee (Tralee Line)</option>
                               <option value="Pilots">Pilots</option>
                             </select>
                           </div>
                           
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">
                               Driving Hours (Actual Driving Time)
                             </label>
                             <div className="flex space-x-2">
                               <input
                                 type="number"
                                 min="0"
                                 max="12"
                                 value={segment.drivingHours}
                                 onChange={(e) => updateRouteSegment(index, segmentIndex, 'drivingHours', parseInt(e.target.value) || 0)}
                                 className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                 placeholder="Hours"
                               />
                               <input
                                 type="number"
                                 min="0"
                                 max="59"
                                 step="5"
                                 value={segment.drivingMinutes}
                                 onChange={(e) => updateRouteSegment(index, segmentIndex, 'drivingMinutes', parseInt(e.target.value) || 0)}
                                 className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                 placeholder="Minutes"
                               />
                             </div>
                             <p className="text-xs text-gray-500 mt-1">
                               Total: {segment.drivingHours}h {segment.drivingMinutes}m
                             </p>
                           </div>
                         </div>
                         
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                             Description
                           </label>
                           <textarea
                             value={segment.description}
                             onChange={(e) => updateRouteSegment(index, segmentIndex, 'description', e.target.value)}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                             placeholder="e.g., 09:25 Cork to Dublin, 11:05 Dublin to Cork"
                             rows={2}
                           />
                         </div>
                       </div>
                     ))}
                   </div>
                   
                   {/* Total Driving Time Summary */}
                   {entry.routeSegments.length > 0 && (
                     <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                       <div className="text-sm font-medium text-blue-900 mb-1">Total Driving Time</div>
                       <div className="text-lg font-bold text-blue-700">
                         {(() => {
                           const totalHours = entry.routeSegments.reduce((total, segment) => 
                             total + segment.drivingHours + (segment.drivingMinutes / 60), 0);
                           const hours = Math.floor(totalHours);
                           const minutes = Math.round((totalHours % 1) * 60);
                           return `${hours}h ${minutes}m`;
                         })()}
                       </div>
                     </div>
                   )}
                   
                   <div className="mt-4">
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       General Duties
                     </label>
                     <textarea
                       value={entry.duties}
                       onChange={(e) => updateDay(index, 'duties', e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                       placeholder="Additional duties or notes for this day"
                       rows={3}
                     />
                   </div>
                 </>
               )}
               
               {entry.dayType === 'rest' && (
                 <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                   <p className="text-gray-600 italic">Rest Day - No duties scheduled</p>
                 </div>
               )}
            </div>
          ))}
        </div>

        {/* Weekly Summary */}
        {entries.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Weekly Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-lg border">
                <div className="text-sm text-gray-600">This Week's Driving Hours</div>
                <div className="text-2xl font-bold text-blue-600">
                  {(() => {
                    const totalHours = entries.reduce((total, entry) => {
                      const dayTotal = entry.routeSegments.reduce((segTotal, segment) => 
                        segTotal + segment.drivingHours + (segment.drivingMinutes / 60), 0);
                      return total + dayTotal;
                    }, 0);
                    const hours = Math.floor(totalHours);
                    const minutes = Math.round((totalHours % 1) * 60);
                    return `${hours}h ${minutes}m`;
                  })()}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="text-sm text-gray-600">Mainline Routes</div>
                <div className="text-2xl font-bold text-green-600">
                  {entries.reduce((total, entry) => 
                    total + entry.routeSegments.filter(segment => segment.isMainline).length, 0)}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="text-sm text-gray-600">Cork East Routes</div>
                <div className="text-2xl font-bold text-orange-600">
                  {entries.reduce((total, entry) => 
                    total + entry.routeSegments.filter(segment => segment.isCorkEast).length, 0)}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="text-sm text-gray-600">Pilot Routes</div>
                <div className="text-2xl font-bold text-purple-600">
                  {entries.reduce((total, entry) => 
                    total + entry.routeSegments.filter(segment => segment.isPilot).length, 0)}
                </div>
              </div>
            </div>
            
            {/* Progress Summary */}
            <div className="mt-4 p-3 bg-white rounded-lg border">
              <div className="text-sm text-gray-600 mb-2">Training Progress Summary</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="font-medium">Work Days:</span> {entries.filter(entry => entry.dayType === 'work').length}
                </div>
                <div>
                  <span className="font-medium">Rest Days:</span> {entries.filter(entry => entry.dayType === 'rest').length}
                </div>
                <div>
                  <span className="font-medium">Tralee Routes:</span> {entries.reduce((total, entry) => 
                    total + entry.routeSegments.filter(segment => segment.isTralee).length, 0)}
                </div>
              </div>
            </div>
          </div>
                 )}

         {/* Export Options */}
         {showExportOptions && (
           <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
             <h3 className="text-lg font-semibold text-green-900 mb-3">Week Saved Successfully! 🎉</h3>
             <p className="text-green-700 mb-4">Your weekly roster has been saved. You can now export it as a PDF.</p>
             
             <div className="flex space-x-3">
               <button
                 onClick={exportPDF}
                 className="btn-secondary flex items-center"
               >
                 <Download className="h-4 w-4 mr-2" />
                 Export PDF
               </button>
               <button
                 onClick={onClose}
                 className="btn-primary flex-1"
               >
                 Done
               </button>
             </div>
           </div>
         )}

         {!showExportOptions && (
           <div className="flex space-x-3">
             <button
               onClick={addDay}
               className="btn-secondary flex items-center"
             >
               <Plus className="h-4 w-4 mr-2" />
               Add Day
             </button>
             <button
               onClick={saveWeek}
               className="btn-primary flex-1"
               disabled={entries.length === 0}
             >
               Save Week
             </button>
             <button
               onClick={onClose}
               className="btn-secondary"
             >
               Cancel
             </button>
           </div>
         )}
      </div>
    </div>
  );
} 