import jsPDF from 'jspdf';
import { Driver, RosterEntry } from '@/types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

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
  
  // Set up colors as tuples
  const primaryColor: [number, number, number] = [0, 51, 102]; // Dark blue
  const accentColor: [number, number, number] = [255, 140, 0]; // Orange
  const lightGray: [number, number, number] = [245, 245, 245];
  const borderColor: [number, number, number] = [200, 200, 200];
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 297, 25, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${driver.name} - Weekly Roster`, 20, 15);
  
  // Date range
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${startDateFormatted} - ${endDateFormatted}`, 20, 25);
  
  // Irish Rail branding
  doc.setFontSize(12);
  doc.text('Iarnród Éireann', 250, 15);
  doc.setFontSize(10);
  doc.text('Irish Rail', 250, 22);
  
  // Main content area
  const contentY = 35;
  
  // Weekly schedule table
  doc.setFillColor(...lightGray);
  doc.rect(20, contentY, 257, 15, 'F');
  
  // Table headers
  doc.setTextColor(...primaryColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  
  const headers = ['Day', 'Book On', 'Book Off', 'Hours', 'Duties'];
  const colWidths = [35, 30, 30, 25, 137];
  let x = 20;
  
  headers.forEach((header, index) => {
    doc.text(header, x + 5, contentY + 10);
    x += colWidths[index];
  });
  
  // Get all days of the week
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  let currentY = contentY + 15;
  
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
    doc.rect(20, currentY, 257, 25, 'F');
    
    // Border
    doc.setDrawColor(...borderColor);
    doc.rect(20, currentY, 257, 25, 'S');
    
    x = 20;
    
    // Day name
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(dayName, x + 5, currentY + 8);
    x += colWidths[0];
    
    if (dayEntry) {
      // Book on time
      doc.setFont('helvetica', 'normal');
      doc.text(dayEntry.bookOnTime || 'N/A', x + 5, currentY + 8);
      x += colWidths[1];
      
      // Book off time
      doc.text(dayEntry.bookOffTime || 'N/A', x + 5, currentY + 8);
      x += colWidths[2];
      
      // Hours
      const hours = dayEntry.totalDrivingHours + (dayEntry.totalDrivingMinutes / 60);
      doc.text(hours.toFixed(1), x + 5, currentY + 8);
      x += colWidths[3];
      
      // Duties - show first line
      const duties = dayEntry.duties;
      const firstLine = duties.length > 60 ? duties.substring(0, 57) + '...' : duties;
      doc.text(firstLine, x + 5, currentY + 8);
      
      // Show second line if duties are long
      if (duties.length > 60) {
        const secondLine = duties.length > 120 ? duties.substring(57, 114) + '...' : duties.substring(57);
        doc.text(secondLine, x + 5, currentY + 16);
      }
    } else {
      // No entry for this day
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('Rest Day', x + 5, currentY + 8);
    }
    
    currentY += 25;
  });
  
  // Detailed duties section
  const dutiesY = currentY + 10;
  
  // Section header
  doc.setFillColor(...primaryColor);
  doc.rect(20, dutiesY, 257, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Daily Duties', 25, dutiesY + 8);
  
  let dutiesCurrentY = dutiesY + 20;
  
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
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${dayName} - ${dayDate}`, 25, dutiesCurrentY);
    
    dutiesCurrentY += 6;
    
    if (dayEntry) {
      // Booking times
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Book On: ${dayEntry.bookOnTime || 'N/A'} | Book Off: ${dayEntry.bookOffTime || 'N/A'} | Hours: ${(dayEntry.totalDrivingHours + dayEntry.totalDrivingMinutes / 60).toFixed(1)}`, 25, dutiesCurrentY);
      
      dutiesCurrentY += 5;
      
      // Duties description
      const duties = dayEntry.duties;
      const maxWidth = 250;
      const lines = doc.splitTextToSize(duties, maxWidth);
      
      lines.forEach((line: string) => {
        doc.text(line, 25, dutiesCurrentY);
        dutiesCurrentY += 4;
      });
      
      // Route information
      if (dayEntry.routeSegments && dayEntry.routeSegments.length > 0) {
        const routeTypes = dayEntry.routeSegments.map(segment => segment.routeType).join(', ');
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text(`Route Type: ${routeTypes}`, 25, dutiesCurrentY);
        doc.setFont('helvetica', 'normal');
        dutiesCurrentY += 4;
      }
    } else {
      // Rest day
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Rest Day - No duties assigned', 25, dutiesCurrentY);
      dutiesCurrentY += 4;
    }
    
    dutiesCurrentY += 3;
    
    // Check if we need a new page
    if (dutiesCurrentY > 180) {
      doc.addPage('landscape');
      dutiesCurrentY = 20;
    }
  });
  
  // Summary section on the last page
  const summaryY = dutiesCurrentY + 5;
  
  // Summary box
  doc.setFillColor(...lightGray);
  doc.rect(20, summaryY, 257, 25, 'F');
  doc.setDrawColor(...borderColor);
  doc.rect(20, summaryY, 257, 25, 'S');
  
  // Calculate totals
  const totalHours = entries.reduce((sum, entry) => sum + entry.totalDrivingHours + (entry.totalDrivingMinutes / 60), 0);
  const totalDays = entries.length;
  
  // Summary text
  doc.setTextColor(...primaryColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Weekly Summary:', 25, summaryY + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Total Working Days: ${totalDays}`, 25, summaryY + 16);
  doc.text(`Total Hours: ${totalHours.toFixed(1)}`, 150, summaryY + 16);
  
  // Route breakdown
  const mainlineDays = entries.filter(entry => 
    entry.routeSegments.some(segment => segment.isMainline)
  ).length;
  
  const otherDays = totalDays - mainlineDays;
  
  doc.text(`Mainline Days: ${mainlineDays}`, 25, summaryY + 22);
  doc.text(`Other Routes: ${otherDays}`, 150, summaryY + 22);
  
  // Bottom border
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(20, 190, 277, 190);
  
  // Footer text
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
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