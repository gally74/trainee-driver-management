'use client';

import { useState } from 'react';
import { Driver } from '@/types';
import { useDriverStore } from '@/store/driverStore';
import { getProgressPercentage, getNextPhase } from '@/utils/trainingProgress';
import { format } from 'date-fns';
import { Calendar, Clock, TrendingUp, MapPin } from 'lucide-react';
import Link from 'next/link';
import { WeeklyRosterBuilder } from './WeeklyRosterBuilder';

interface DriverCardProps {
  driver: Driver;
}

export function DriverCard({ driver }: DriverCardProps) {
  const { getDriverProgress } = useDriverStore();
  const progress = getDriverProgress(driver.id);
  const [showWeeklyBuilder, setShowWeeklyBuilder] = useState(false);
  
  if (!progress) return null;

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

  const getPhaseDetails = () => {
    switch (driver.currentPhase) {
      case 'trainee':
        return {
          completed: progress.traineeDaysCompleted,
          total: 70,
          unit: 'days',
          subtitle: `${progress.mainlineDaysCompleted}/56 mainline days`
        };
      case 'appointed':
        return {
          completed: progress.appointedDaysCompleted || 0,
          total: 20,
          unit: 'days',
          subtitle: 'Shared mainline/pilots'
        };
      case 'cork-east-learning':
        return {
          completed: progress.corkEastCobhTrips + progress.corkEastMidletonTrips,
          total: 22,
          unit: 'trips',
          subtitle: `${progress.corkEastCobhTrips}/12 Cobh, ${progress.corkEastMidletonTrips}/10 Midleton`
        };
      case 'cork-east-solo':
        return {
          completed: progress.corkEastSoloDays || 0,
          total: 5,
          unit: 'days',
          subtitle: 'Solo operation'
        };
      case 'tralee-learning':
        return {
          completed: progress.traleeLearningDays,
          total: 22,
          unit: 'days',
          subtitle: 'Tralee line learning'
        };
      case 'tralee-solo':
        return {
          completed: progress.traleeSoloTrips || 0,
          total: 5,
          unit: 'trips',
          subtitle: 'Solo operation'
        };
      default:
        return {
          completed: 0,
          total: 0,
          unit: 'days',
          subtitle: 'Complete'
        };
    }
  };

  const phaseDetails = getPhaseDetails();

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{driver.name}</h3>
          <p className="text-sm text-gray-600">{getPhaseDisplayName(driver.currentPhase)}</p>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          driver.status === 'trainee' ? 'bg-warning-100 text-warning-800' :
          driver.status === 'appointed' ? 'bg-success-100 text-success-800' :
          'bg-primary-100 text-primary-800'
        }`}>
          {driver.status}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          Started: {(() => {
            try {
              return format(new Date(driver.startDate), 'dd/MM/yyyy');
            } catch (error) {
              return 'Invalid date';
            }
          })()}
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-2" />
          {phaseDetails.completed}/{phaseDetails.total} {phaseDetails.unit}
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <TrendingUp className="h-4 w-4 mr-2" />
          {(() => {
            const hours = Math.floor(progress.traineeHoursCompleted);
            const minutes = Math.round((progress.traineeHoursCompleted % 1) * 60);
            return `${hours}h ${minutes}m driving time completed`;
          })()}
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2" />
          {phaseDetails.subtitle}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className={`progress-fill ${getStatusColor(progressPercentage)}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Next Phase */}
      {driver.currentPhase !== 'mainline' && (
        <div className="text-sm text-gray-600 mb-4">
          <span className="font-medium">Next:</span> {getPhaseDisplayName(nextPhase)}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Link 
          href={`/driver?id=${driver.id}`}
          className="btn-primary flex-1 text-center text-sm"
        >
          View Details
        </Link>
        <button 
          onClick={() => setShowWeeklyBuilder(true)}
          className="btn-secondary flex-1 text-center text-sm"
        >
          Weekly Roster
        </button>
      </div>

      {/* Weekly Roster Builder Modal */}
      {showWeeklyBuilder && (
        <WeeklyRosterBuilder
          driverId={driver.id}
          onClose={() => setShowWeeklyBuilder(false)}
        />
      )}
    </div>
  );
} 