'use client';

import { useSearchParams } from 'next/navigation';
import { useDriverStore } from '@/store/driverStore';
import { getProgressPercentage, getNextPhase, TRAINING_REQUIREMENTS } from '@/utils/trainingProgress';
import { exportTrainingReportPDF, exportDriverHistoryPDF } from '@/utils/pdfExport';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Clock, MapPin, TrendingUp, Target, Download, Mail } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function DriverDetailContent() {
  const searchParams = useSearchParams();
  const driverId = searchParams.get('id') as string;
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

      {/* Current Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Current Status</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            driver.status === 'trainee' ? 'bg-warning-100 text-warning-800' :
            driver.status === 'appointed' ? 'bg-success-100 text-success-800' :
            driver.status === 'qualified' ? 'bg-primary-100 text-primary-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {driver.status === 'trainee' ? 'Trainee' :
             driver.status === 'appointed' ? 'Appointed' :
             driver.status === 'qualified' ? 'Qualified' :
             driver.status === 'mainline' ? 'Mainline' : 'Unknown'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <Target className="h-5 w-5 text-primary-600 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Current Phase</p>
              <p className="font-medium">{getPhaseDisplayName(driver.currentPhase)}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-primary-600 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Start Date</p>
              <p className="font-medium">{format(new Date(driver.startDate), 'dd/MM/yyyy')}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-primary-600 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Overall Progress</p>
              <p className="font-medium">{progressPercentage}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Training Progress</h2>
        
        <div className="space-y-6">
          {/* Overall Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-600">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(progressPercentage)}`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Days Completed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Training Days</span>
                <span className="text-sm text-gray-600">
                  {progress.traineeDaysCompleted} / {TRAINING_REQUIREMENTS.trainee.totalDays}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-primary-600 transition-all duration-300"
                  style={{ width: `${(progress.traineeDaysCompleted / TRAINING_REQUIREMENTS.trainee.totalDays) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {daysRemaining} days remaining
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Mainline Days</span>
                <span className="text-sm text-gray-600">
                  {progress.mainlineDaysCompleted} / {TRAINING_REQUIREMENTS.trainee.mainlineDays}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${(progress.mainlineDaysCompleted / TRAINING_REQUIREMENTS.trainee.mainlineDays) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {mainlineDaysRemaining} days remaining
              </p>
            </div>
          </div>

          {/* Hours Completed */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Training Hours</span>
              <span className="text-sm text-gray-600">
                {progress.traineeHoursCompleted} / {TRAINING_REQUIREMENTS.trainee.totalHours}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-green-600 transition-all duration-300"
                style={{ width: `${(progress.traineeHoursCompleted / TRAINING_REQUIREMENTS.trainee.totalHours) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {hoursRemaining} hours remaining
            </p>
          </div>
        </div>
      </div>

      {/* Route Progress */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Route Progress</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Mainline</h3>
            <p className="text-2xl font-bold text-blue-600">{progress.mainlineDaysCompleted}</p>
            <p className="text-sm text-gray-600">days completed</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <MapPin className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Cork East</h3>
            <p className="text-2xl font-bold text-green-600">{progress.corkEastCobhTrips + progress.corkEastMidletonTrips}</p>
            <p className="text-sm text-gray-600">trips completed</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <MapPin className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Tralee</h3>
            <p className="text-2xl font-bold text-purple-600">{progress.traleeLearningDays}</p>
            <p className="text-sm text-gray-600">days completed</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
        
        <div className="flex flex-wrap gap-4">
          <Link 
            href={`/roster?id=${driver.id}`}
            className="btn-primary flex items-center"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Manage Roster
          </Link>
          
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
          
          <button 
            onClick={handleEmailReport}
            className="btn-secondary flex items-center"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Report
          </button>
        </div>
      </div>

      {/* Recent Roster Entries */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Roster Entries</h2>
          <Link 
            href={`/roster?id=${driver.id}`}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View All
          </Link>
        </div>
        
        {rosterEntries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No roster entries found</p>
        ) : (
          <div className="space-y-3">
            {rosterEntries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {format(new Date(entry.date), 'dd/MM/yyyy')}
                    </p>
                    <p className="text-sm text-gray-600">{entry.duties}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {entry.bookOnTime} - {entry.bookOffTime}
                  </p>
                  <p className="text-xs text-gray-600">
                    {entry.routeSegments.length > 0 ? entry.routeSegments[0].routeType : 'other'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DriverDetailPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
        </div>
      </div>
    }>
      <DriverDetailContent />
    </Suspense>
  );
} 