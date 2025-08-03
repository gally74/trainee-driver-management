'use client';

import { useParams } from 'next/navigation';
import { useDriverStore } from '@/store/driverStore';
import { getProgressPercentage, getNextPhase, TRAINING_REQUIREMENTS } from '@/utils/trainingProgress';
import { exportTrainingReportPDF, exportDriverHistoryPDF } from '@/utils/pdfExport';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Clock, MapPin, TrendingUp, Target, Download, Mail } from 'lucide-react';
import Link from 'next/link';

export default function DriverDetailPage() {
  const params = useParams();
  const driverId = params.driverId as string;
  const { getDriver, getDriverProgress, getRosterEntriesForDriver } = useDriverStore();
  
  const driver = getDriver(driverId);
  const progress = getDriverProgress(driverId);
  const rosterEntries = getRosterEntriesForDriver(driverId);

  if (!driver || !progress) {
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

  const progressPercentage = getProgressPercentage(progress, driver.currentPhase);
  const nextPhase = getNextPhase(driver.currentPhase);

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-success-500';
    if (percentage >= 60) return 'bg-warning-500';
    return 'bg-danger-500';
  };

  const getPhaseDisplayName = (phase: string) => {
    const phaseNames: Record<string, string> = {
      'trainee': 'Trainee',
      'appointed': 'Appointed Driver',
      'cork-east-learning': 'Cork East Learning',
      'cork-east-solo': 'Cork East Solo',
      'tralee-learning': 'Tralee Learning',
      'tralee-solo': 'Tralee Solo',
      'mainline': 'Mainline Driver'
    };
    return phaseNames[phase] || phase;
  };

  const daysRemaining = TRAINING_REQUIREMENTS.trainee.totalDays - progress.traineeDaysCompleted;
  const mainlineDaysRemaining = TRAINING_REQUIREMENTS.trainee.mainlineDays - progress.mainlineDaysCompleted;
  const hoursRemaining = TRAINING_REQUIREMENTS.trainee.totalHours - progress.traineeHoursCompleted;

  const handleExportTrainingReport = () => {
    const doc = exportTrainingReportPDF(driver, progress, rosterEntries);
    doc.save(`${driver.name}-training-report.pdf`);
  };

  const handleExportDriverHistory = () => {
    const doc = exportDriverHistoryPDF(driver, progress, rosterEntries);
    doc.save(`${driver.name}-training-history.pdf`);
  };

  const handleEmailReport = () => {
    const doc = exportTrainingReportPDF(driver, progress, rosterEntries);
    const pdfBlob = doc.output('blob');
    
    const subject = encodeURIComponent(`Training Report - ${driver.name}`);
    const body = encodeURIComponent(`Please find attached the training report for ${driver.name}.`);
    
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
    window.open(mailtoLink);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {driver.name} - Training Progress
        </h1>
        <p className="text-gray-600">
          Detailed training progress and requirements
        </p>
      </div>

      {/* Current Phase Overview */}
      <div className="card mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Current Phase: {getPhaseDisplayName(driver.currentPhase)}
            </h2>
            <p className="text-gray-600">
              Started training on {format(new Date(driver.startDate), 'MMMM dd, yyyy')}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            driver.status === 'trainee' ? 'bg-warning-100 text-warning-800' :
            driver.status === 'appointed' ? 'bg-success-100 text-success-800' :
            'bg-primary-100 text-primary-800'
          }`}>
            {driver.status}
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Overall Progress</span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className={`progress-fill ${getStatusColor(progressPercentage)}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {driver.currentPhase !== 'mainline' && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Next Phase:</span> {getPhaseDisplayName(nextPhase)}
          </div>
        )}
      </div>

      {/* Training Requirements Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Trainee Phase Requirements */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-primary-600" />
            Trainee Phase Requirements
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium text-gray-900">Total Days</span>
                <p className="text-sm text-gray-600">Required: 70 days</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">{progress.traineeDaysCompleted}/70</span>
                <p className="text-sm text-gray-600">{daysRemaining} remaining</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium text-gray-900">Mainline Days</span>
                <p className="text-sm text-gray-600">Required: 56 days minimum</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">{progress.mainlineDaysCompleted}/56</span>
                <p className="text-sm text-gray-600">{mainlineDaysRemaining} remaining</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium text-gray-900">Total Hours</span>
                <p className="text-sm text-gray-600">Required: 250 hours minimum</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">{Math.round(progress.traineeHoursCompleted)}/250</span>
                <p className="text-sm text-gray-600">{Math.round(hoursRemaining)} remaining</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium text-gray-900">Pilot Days</span>
                <p className="text-sm text-gray-600">Required: 14 days</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">{progress.pilotDaysCompleted}/14</span>
                <p className="text-sm text-gray-600">{14 - progress.pilotDaysCompleted} remaining</p>
              </div>
            </div>
          </div>
        </div>

        {/* Route Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-primary-600" />
            Route Breakdown
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div>
                <span className="font-medium text-blue-900">Mainline Routes</span>
                <p className="text-sm text-blue-700">Cork-Dublin, Cork-Mallow</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-blue-900">{progress.mainlineDaysCompleted}</span>
                <p className="text-sm text-blue-700">days</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div>
                <span className="font-medium text-green-900">Pilot Routes</span>
                <p className="text-sm text-green-700">Yard/Shed work</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-green-900">{progress.pilotDaysCompleted}</span>
                <p className="text-sm text-green-700">days</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <div>
                <span className="font-medium text-purple-900">Cork East</span>
                <p className="text-sm text-purple-700">Cobh & Midleton</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-purple-900">{progress.corkEastCobhTrips + progress.corkEastMidletonTrips}</span>
                <p className="text-sm text-purple-700">trips</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <div>
                <span className="font-medium text-orange-900">Tralee Routes</span>
                <p className="text-sm text-orange-700">Tralee line</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-orange-900">{progress.traleeLearningDays}</span>
                <p className="text-sm text-orange-700">days</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
          Recent Roster Activity
        </h3>
        
        {rosterEntries.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No roster entries yet</p>
            <Link href={`/roster/${driver.id}`} className="btn-primary">
              Add Roster Entries
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {rosterEntries
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5)
              .map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <span className="font-medium text-gray-900">
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                      <p className="text-sm text-gray-600">{entry.duties}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      entry.routeSegments.some(segment => segment.isMainline) ? 'bg-blue-100 text-blue-800' :
                      entry.routeSegments.some(segment => segment.isPilot) ? 'bg-green-100 text-green-800' :
                      entry.routeSegments.some(segment => segment.isCorkEast) ? 'bg-purple-100 text-purple-800' :
                      entry.routeSegments.some(segment => segment.isTralee) ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {entry.routeSegments.length > 0 ? entry.routeSegments[0].routeType : 'other'}
                    </span>
                  </div>
                </div>
              ))}
            {rosterEntries.length > 5 && (
              <div className="text-center pt-4">
                <Link href={`/roster/${driver.id}`} className="text-primary-600 hover:text-primary-700">
                  View all {rosterEntries.length} entries →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 mt-8">
        <Link href={`/roster/${driver.id}`} className="btn-primary flex-1 text-center">
          Manage Roster
        </Link>
        <button onClick={handleExportTrainingReport} className="btn-secondary flex items-center justify-center">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </button>
        <button onClick={handleExportDriverHistory} className="btn-secondary flex items-center justify-center">
          <Download className="h-4 w-4 mr-2" />
          Export History
        </button>
        <button onClick={handleEmailReport} className="btn-secondary flex items-center justify-center">
          <Mail className="h-4 w-4 mr-2" />
          Email Report
        </button>
        <Link href="/" className="btn-secondary flex-1 text-center">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
} 