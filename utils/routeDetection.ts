import { RouteDetection } from '@/types';

export function detectRouteType(duties: string): RouteDetection {
  const dutiesLower = duties.toLowerCase();
  
  // Mainline routes: Cork to Dublin and Cork to Mallow
  const mainlinePatterns = [
    /cork.*dublin/i,
    /dublin.*cork/i,
    /cork.*mallow/i,
    /mallow.*cork/i,
    /empty train.*cork.*mallow/i,
    /empty train.*mallow.*cork/i
  ];
  
  // Pilot routes (yard/shed work)
  const pilotPatterns = [
    /pilot/i,
    /yard/i,
    /shed/i,
    /cork yard/i,
    /cork shed/i
  ];
  
  // Cork East routes
  const corkEastPatterns = [
    /cork.*cobh/i,
    /cobh.*cork/i,
    /cork.*midleton/i,
    /midleton.*cork/i
  ];
  
  // Tralee routes
  const traleePatterns = [
    /cork.*tralee/i,
    /tralee.*cork/i,
    /mallow.*tralee/i,
    /tralee.*mallow/i
  ];
  
  // Check for mainline routes
  const isMainline = mainlinePatterns.some(pattern => pattern.test(dutiesLower));
  
  // Check for pilot routes
  const isPilot = pilotPatterns.some(pattern => pattern.test(dutiesLower));
  
  // Check for Cork East routes
  const isCorkEast = corkEastPatterns.some(pattern => pattern.test(dutiesLower));
  
  // Check for Tralee routes
  const isTralee = traleePatterns.some(pattern => pattern.test(dutiesLower));
  
  // Determine route type
  let routeType: 'mainline' | 'pilot' | 'cork-east' | 'tralee' | 'other' = 'other';
  
  if (isMainline) {
    routeType = 'mainline';
  } else if (isPilot) {
    routeType = 'pilot';
  } else if (isCorkEast) {
    routeType = 'cork-east';
  } else if (isTralee) {
    routeType = 'tralee';
  }
  
  return {
    isMainline,
    isPilot,
    isCorkEast,
    isTralee,
    routeType
  };
}

export function calculateHours(bookOnTime: string, bookOffTime: string): number {
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
}

export function isRestDay(duties: string): boolean {
  return duties.toLowerCase().includes('rest day') || duties.trim() === '';
} 