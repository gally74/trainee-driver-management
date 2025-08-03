import jsPDF from 'jspdf';
import { Driver, RosterEntry } from '@/types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

// Function to get available weekly rosters for a driver
export function getAvailableWeeklyRosters(driver: Driver, entries: RosterEntry[]) {
  // Group entries by week ending (Sunday)
  const weeklyRosters = new Map<string, RosterEntry[]>();
  
  entries.forEach(entry => {
    const entryDate = new Date(entry.date);
    const weekEnd = endOfWeek(entryDate, { weekStartsOn: 1 }); // Sunday
    const weekEndKey = format(weekEnd, 'yyyy-MM-dd');
    
    if (!weeklyRosters.has(weekEndKey)) {
      weeklyRosters.set(weekEndKey, []);
    }
    weeklyRosters.get(weekEndKey)!.push(entry);
  });
  
  // Convert to array and sort by date (newest first)
  const availableRosters = Array.from(weeklyRosters.entries())
    .map(([weekEnding, weekEntries]) => ({
      weekEnding,
      weekStart: format(startOfWeek(new Date(weekEnding), { weekStartsOn: 1 }), 'dd MMM yyyy'),
      weekEnd: format(new Date(weekEnding), 'dd MMM yyyy'),
      entryCount: weekEntries.length,
      totalHours: weekEntries.reduce((sum, entry) => sum + entry.totalDrivingHours + (entry.totalDrivingMinutes / 60), 0)
    }))
    .sort((a, b) => new Date(b.weekEnding).getTime() - new Date(a.weekEnding).getTime());
  
  return availableRosters;
}

export function exportWeeklyRosterPDF(driver: Driver, entries: RosterEntry[], weekEnding: string) {
  // Create landscape PDF
  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  // Calculate the week range (Monday to Sunday)
  const weekEndingDate = new Date(weekEnding);
  const weekStart = startOfWeek(weekEndingDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(weekEndingDate, { weekStartsOn: 1 }); // Sunday
  
  // Format the date range for the title
  const startDateFormatted = format(weekStart, 'dd MMMM');
  const endDateFormatted = format(weekEnd, 'dd MMMM yyyy');
  
  // Set up colors
  const primaryColor: [number, number, number] = [0, 51, 102]; // Dark blue
  const secondaryColor: [number, number, number] = [255, 140, 0]; // Orange
  const lightGray: [number, number, number] = [245, 245, 245];
  const borderColor: [number, number, number] = [200, 200, 200];
  
  // Header with Irish Rail branding
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 297, 30, 'F');
  
  // Irish Rail logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Iarnród Éireann', 20, 15);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Irish Rail', 20, 25);
  
  // Main title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(`${driver.name}`, 150, 15);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  doc.text(`Weekly Roster`, 150, 25);
  
  // Date range
  doc.setFontSize(14);
  doc.text(`${startDateFormatted} - ${endDateFormatted}`, 150, 35);
  
  // Main content area
  const contentY = 45;
  
  // Weekly schedule table
  doc.setFillColor(...lightGray);
  doc.rect(20, contentY, 257, 12, 'F');
  
  // Table headers
  doc.setTextColor(...primaryColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  
  const headers = ['Day', 'Book On', 'Book Off', 'Hours', 'Duties'];
  const colWidths = [40, 35, 35, 30, 117];
  let x = 20;
  
  headers.forEach((header, index) => {
    doc.text(header, x + 5, contentY + 8);
    x += colWidths[index];
  });
  
  // Get all days of the week
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  let currentY = contentY + 12;
  
  // Fill in the week's schedule
  weekDays.forEach((day, index) => {
    const dayName = format(day, 'EEEE');
    const dayEntry = entries.find(entry => {
      const entryDate = new Date(entry.date);
      return format(entryDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    });
    
    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 249, 250);
    }
    doc.rect(20, currentY, 257, 20, 'F');
    
    // Border
    doc.setDrawColor(...borderColor);
    doc.rect(20, currentY, 257, 20, 'S');
    
    x = 20;
    
    // Day name
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(dayName, x + 5, currentY + 12);
    x += colWidths[0];
    
    if (dayEntry) {
      // Book on time
      doc.setFont('helvetica', 'normal');
      doc.text(dayEntry.bookOnTime || 'N/A', x + 5, currentY + 12);
      x += colWidths[1];
      
      // Book off time
      doc.text(dayEntry.bookOffTime || 'N/A', x + 5, currentY + 12);
      x += colWidths[2];
      
      // Hours
      const hours = dayEntry.totalDrivingHours + (dayEntry.totalDrivingMinutes / 60);
      doc.text(hours.toFixed(1), x + 5, currentY + 12);
      x += colWidths[3];
      
      // Duties (truncated for table)
      const duties = dayEntry.duties;
      const displayDuties = duties.length > 50 ? duties.substring(0, 47) + '...' : duties;
      doc.text(displayDuties, x + 5, currentY + 12);
    } else {
      // No entry for this day
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('Rest Day', x + 5, currentY + 12);
    }
    
    currentY += 20;
  });
  
  // Detailed duties section
  const dutiesY = currentY + 15;
  
  // Section header
  doc.setFillColor(...primaryColor);
  doc.rect(20, dutiesY, 257, 15, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Daily Duties Breakdown', 25, dutiesY + 10);
  
  let dutiesCurrentY = dutiesY + 25;
  
  // Add detailed duties for each day
  weekDays.forEach((day, index) => {
    const dayName = format(day, 'EEEE');
    const dayDate = format(day, 'dd/MM/yyyy');
    const dayEntry = entries.find(entry => {
      const entryDate = new Date(entry.date);
      return format(entryDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    });
    
    // Day header
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${dayName} - ${dayDate}`, 25, dutiesCurrentY);
    
    dutiesCurrentY += 8;
    
    if (dayEntry) {
      // Booking times
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Book On: ${dayEntry.bookOnTime || 'N/A'} | Book Off: ${dayEntry.bookOffTime || 'N/A'} | Hours: ${(dayEntry.totalDrivingHours + dayEntry.totalDrivingMinutes / 60).toFixed(1)}`, 25, dutiesCurrentY);
      
      dutiesCurrentY += 6;
      
      // Duties description
      const duties = dayEntry.duties;
      const maxWidth = 250;
      const lines = doc.splitTextToSize(duties, maxWidth);
      
      lines.forEach((line: string) => {
        doc.text(line, 25, dutiesCurrentY);
        dutiesCurrentY += 5;
      });
      
      // Route information
      if (dayEntry.routeSegments && dayEntry.routeSegments.length > 0) {
        const routeTypes = dayEntry.routeSegments.map(segment => segment.routeType).join(', ');
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text(`Route Type: ${routeTypes}`, 25, dutiesCurrentY);
        doc.setFont('helvetica', 'normal');
        dutiesCurrentY += 5;
      }
    } else {
      // Rest day
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Rest Day - No duties assigned', 25, dutiesCurrentY);
      dutiesCurrentY += 5;
    }
    
    dutiesCurrentY += 5;
    
    // Check if we need a new page
    if (dutiesCurrentY > 180) {
      doc.addPage('landscape');
      dutiesCurrentY = 20;
    }
  });
  
  // Summary section on the last page
  const summaryY = dutiesCurrentY + 10;
  
  // Summary box
  doc.setFillColor(...lightGray);
  doc.rect(20, summaryY, 257, 30, 'F');
  doc.setDrawColor(...borderColor);
  doc.rect(20, summaryY, 257, 30, 'S');
  
  // Calculate totals
  const totalHours = entries.reduce((sum, entry) => sum + entry.totalDrivingHours + (entry.totalDrivingMinutes / 60), 0);
  const totalDays = entries.length;
  
  // Summary text
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Weekly Summary', 25, summaryY + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Total Working Days: ${totalDays}`, 25, summaryY + 20);
  doc.text(`Total Hours: ${totalHours.toFixed(1)}`, 150, summaryY + 20);
  
  // Route breakdown
  const mainlineDays = entries.filter(entry => 
    entry.routeSegments.some(segment => segment.isMainline)
  ).length;
  
  const otherDays = totalDays - mainlineDays;
  
  doc.text(`Mainline Days: ${mainlineDays}`, 25, summaryY + 28);
  doc.text(`Other Routes: ${otherDays}`, 150, summaryY + 28);
  
  // Footer
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(20, 190, 277, 190);
  
  // Footer text
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated by Trainee Driver Management System', 20, 195);
  doc.text(`Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 200, 195);
  
  return doc;
}

// Keep the other export functions as they are
export function exportTrainingReportPDF(driver: Driver, progress: any, entries: RosterEntry[]) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`Training Report - ${driver.name}`, 20, 30);
  
  // Driver info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Start Date: ${driver.startDate}`, 20, 50);
  doc.text(`Current Phase: ${driver.currentPhase}`, 20, 60);
  doc.text(`Status: ${driver.status}`, 20, 70);
  
  // Progress summary
  doc.setFont('helvetica', 'bold');
  doc.text('Training Progress:', 20, 90);
  doc.setFont('helvetica', 'normal');
  doc.text(`Days Completed: ${progress.traineeDaysCompleted}/70`, 20, 100);
  doc.text(`Hours Completed: ${progress.traineeHoursCompleted}/250`, 20, 110);
  doc.text(`Mainline Days: ${progress.mainlineDaysCompleted}/56`, 20, 120);
  
  return doc;
}

export function exportDriverHistoryPDF(driver: Driver, progress: any, entries: RosterEntry[]) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`Driver History - ${driver.name}`, 20, 30);
  
  // Driver info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Start Date: ${driver.startDate}`, 20, 50);
  doc.text(`Current Phase: ${driver.currentPhase}`, 20, 60);
  doc.text(`Status: ${driver.status}`, 20, 70);
  
  // Recent entries
  doc.setFont('helvetica', 'bold');
  doc.text('Recent Roster Entries:', 20, 90);
  doc.setFont('helvetica', 'normal');
  
  entries.slice(0, 10).forEach((entry, index) => {
    const y = 100 + (index * 8);
    doc.text(`${entry.date}: ${entry.duties}`, 20, y);
  });
  
  return doc;
} 