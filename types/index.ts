export interface Driver {
  id: string;
  name: string;
  startDate: string;
  status: DriverStatus;
  currentPhase: TrainingPhase;
}

export type DriverStatus = 'trainee' | 'appointed' | 'qualified' | 'mainline';

export type TrainingPhase = 
  | 'trainee'
  | 'appointed'
  | 'cork-east-learning'
  | 'cork-east-solo'
  | 'tralee-learning'
  | 'tralee-solo'
  | 'mainline';

export interface TrainingProgress {
  // Trainee phase requirements
  traineeDaysCompleted: number;
  traineeHoursCompleted: number;
  traineeWeeksCompleted: number;
  mainlineDaysCompleted: number;
  pilotDaysCompleted: number;
  
  // Appointed phase requirements
  appointedDaysCompleted: number;
  
  // Cork East requirements
  corkEastCobhTrips: number;
  corkEastMidletonTrips: number;
  corkEastSoloDays: number;
  
  // Tralee requirements
  traleeLearningDays: number;
  traleeSoloTrips: number;
}

export interface RouteSegment {
  route: string;
  routeType: RouteType;
  isMainline: boolean;
  isPilot: boolean;
  isCorkEast: boolean;
  isTralee: boolean;
  drivingHours: number;
  drivingMinutes: number;
  description: string;
}

export interface RosterEntry {
  id: string;
  driverId: string;
  date: string;
  duties: string;
  bookOnTime?: string;
  bookOffTime?: string;
  routeSegments: RouteSegment[];
  totalDrivingHours: number;
  totalDrivingMinutes: number;
}

export type RouteType = 'mainline' | 'pilot' | 'cork-east' | 'tralee' | 'other';

export interface WeeklyRoster {
  weekEnding: string;
  entries: RosterEntry[];
}

export interface TrainingRequirements {
  trainee: {
    totalDays: 70;
    totalWeeks: 14;
    totalHours: 250;
    mainlineDays: 56;
    pilotDays: 14;
  };
  appointed: {
    totalDays: 20;
  };
  corkEast: {
    cobhTrips: 12;
    midletonTrips: 10;
    soloDays: 5;
  };
  tralee: {
    learningDays: 22;
    soloTrips: 5;
  };
}

export interface RouteDetection {
  isMainline: boolean;
  isPilot: boolean;
  isCorkEast: boolean;
  isTralee: boolean;
  routeType: RouteType;
} 