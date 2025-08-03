import { Driver, RosterEntry, TrainingProgress } from '@/types';

export const TRAINING_REQUIREMENTS = {
  trainee: {
    totalDays: 70,
    mainlineDays: 56,
    totalHours: 250,
    pilotDays: 14,
    corkEastCobhTrips: 10,
    corkEastMidletonTrips: 10,
    traleeLearningDays: 5
  },
  appointed: {
    totalDays: 30,
    mainlineDays: 20,
    totalHours: 100,
    pilotDays: 5,
    corkEastCobhTrips: 5,
    corkEastMidletonTrips: 5,
    traleeLearningDays: 3
  },
  'cork-east-learning': {
    totalDays: 20,
    mainlineDays: 10,
    totalHours: 80,
    pilotDays: 3,
    corkEastCobhTrips: 15,
    corkEastMidletonTrips: 15,
    traleeLearningDays: 0
  },
  'cork-east-solo': {
    totalDays: 15,
    mainlineDays: 5,
    totalHours: 60,
    pilotDays: 2,
    corkEastCobhTrips: 20,
    corkEastMidletonTrips: 20,
    traleeLearningDays: 0
  },
  'tralee-learning': {
    totalDays: 25,
    mainlineDays: 15,
    totalHours: 100,
    pilotDays: 5,
    corkEastCobhTrips: 0,
    corkEastMidletonTrips: 0,
    traleeLearningDays: 10
  },
  'tralee-solo': {
    totalDays: 20,
    mainlineDays: 10,
    totalHours: 80,
    pilotDays: 3,
    corkEastCobhTrips: 0,
    corkEastMidletonTrips: 0,
    traleeLearningDays: 15
  },
  mainline: {
    totalDays: 0,
    mainlineDays: 0,
    totalHours: 0,
    pilotDays: 0,
    corkEastCobhTrips: 0,
    corkEastMidletonTrips: 0,
    traleeLearningDays: 0
  }
};

export function calculateTrainingProgress(driver: Driver, rosterEntries: RosterEntry[]): TrainingProgress {
  const driverEntries = rosterEntries.filter(entry => entry.driverId === driver.id);
  
  // Calculate trainee phase progress from route segments
  let traineeDaysCompleted = 0;
  let traineeHoursCompleted = 0;
  let mainlineDaysCompleted = 0;
  let pilotDaysCompleted = 0;
  let corkEastCobhTrips = 0;
  let corkEastMidletonTrips = 0;
  let traleeLearningDays = 0;
  
  // Process each roster entry and its route segments
  driverEntries.forEach(entry => {
    if (entry.routeSegments && entry.routeSegments.length > 0) {
      // Count this as a trainee day if it has any route segments
      traineeDaysCompleted++;
      
      // Calculate total driving hours for this entry
      const entryHours = entry.routeSegments.reduce((total, segment) => 
        total + segment.drivingHours + (segment.drivingMinutes / 60), 0);
      traineeHoursCompleted += entryHours;
      
      // Count route types from segments
      entry.routeSegments.forEach(segment => {
        if (segment.isMainline) {
          mainlineDaysCompleted++;
        }
        if (segment.isPilot) {
          pilotDaysCompleted++;
        }
        if (segment.isTralee) {
          traleeLearningDays++;
        }
        if (segment.isCorkEast) {
          // Count specific Cork East routes
          if (segment.route.includes('Cobh')) {
            corkEastCobhTrips++;
          }
          if (segment.route.includes('Midleton')) {
            corkEastMidletonTrips++;
          }
        }
      });
    }
  });
  
  return {
    traineeDaysCompleted,
    traineeHoursCompleted,
    traineeWeeksCompleted: Math.ceil(traineeDaysCompleted / 5), // Estimate weeks based on 5-day weeks
    mainlineDaysCompleted,
    pilotDaysCompleted,
    appointedDaysCompleted: 0, // Will be calculated when driver reaches appointed phase
    corkEastCobhTrips,
    corkEastMidletonTrips,
    corkEastSoloDays: 0, // Will be calculated when driver reaches Cork East solo phase
    traleeLearningDays,
    traleeSoloTrips: 0 // Will be calculated when driver reaches Tralee solo phase
  };
}

export function getProgressPercentage(progress: TrainingProgress, currentPhase: string): number {
  const requirements = TRAINING_REQUIREMENTS[currentPhase as keyof typeof TRAINING_REQUIREMENTS];
  if (!requirements) return 0;
  
  const totalRequired = requirements.totalDays + requirements.mainlineDays + requirements.pilotDays;
  const totalCompleted = progress.traineeDaysCompleted + progress.mainlineDaysCompleted + progress.pilotDaysCompleted;
  
  if (totalRequired === 0) return 100;
  
  return Math.min((totalCompleted / totalRequired) * 100, 100);
}

export function getNextPhase(currentPhase: string): string {
  const phaseOrder = [
    'trainee',
    'appointed',
    'cork-east-learning',
    'cork-east-solo',
    'tralee-learning',
    'tralee-solo',
    'mainline'
  ];
  
  const currentIndex = phaseOrder.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex === phaseOrder.length - 1) {
    return currentPhase;
  }
  
  return phaseOrder[currentIndex + 1];
}

export function canAdvanceToNextPhase(driver: Driver, progress: TrainingProgress): boolean {
  const requirements = TRAINING_REQUIREMENTS[driver.currentPhase as keyof typeof TRAINING_REQUIREMENTS];
  if (!requirements) return false;
  
  return (
    progress.traineeDaysCompleted >= requirements.totalDays &&
    progress.mainlineDaysCompleted >= requirements.mainlineDays &&
    progress.pilotDaysCompleted >= requirements.pilotDays &&
    progress.traineeHoursCompleted >= requirements.totalHours &&
    progress.corkEastCobhTrips >= requirements.corkEastCobhTrips &&
    progress.corkEastMidletonTrips >= requirements.corkEastMidletonTrips &&
    progress.traleeLearningDays >= requirements.traleeLearningDays
  );
} 