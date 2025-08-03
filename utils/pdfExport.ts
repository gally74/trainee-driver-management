import jsPDF from 'jspdf';
import { Driver, RosterEntry, TrainingProgress } from '@/types';
import { format } from 'date-fns';

// Helper function to add Irish Rail logo
function addIrishRailLogo(doc: jsPDF, y: number) {
  // Draw a simple representation of the Irish Rail logo
  // Green and orange chevron pointing right
  doc.setFillColor(0, 128, 0); // Green
  doc.rect(85, y - 3, 10, 6, 'F');
  
  doc.setFillColor(255, 140, 0); // Orange
  doc.rect(95, y - 3, 10, 6, 'F');
  
  // Add text
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Iarnród Éireann', 110, y);
  doc.setFontSize(10);
  doc.setTextColor(0, 128, 0);
  doc.text('Irish Rail', 110, y + 5);
}

export function exportWeeklyRosterPDF(driver: Driver, entries: RosterEntry[], weekEnding: string) {
  const doc = new jsPDF();
  
  // Add Irish Rail logo at top
  addIrishRailLogo(doc, 20);
  
  // Calculate week ending date
  const weekEndingDate = new Date(weekEnding);
  const formattedWeekEnding = format(weekEndingDate, 'dd\'st\' MMMM yyyy');
  
  // Title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(`Roster Week Ending ${formattedWeekEnding}`, 20, 45);
  
  // Create roster table similar to Irish Rail format
  const startY = 60;
  let currentY = startY;
  
  // Table headers with Irish Rail styling
  const headers = ['PQP Driver', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  doc.setFontSize(10);
  doc.setFillColor(200, 230, 200); // Light green background
  doc.rect(20, currentY, 170, 10, 'F');
  
  let x = 20;
  const colWidths = [40, 18, 18, 18, 18, 18, 18, 18];
  
  headers.forEach((header, index) => {
    doc.setTextColor(0, 0, 0);
    doc.text(header, x + 2, currentY + 7);
    x += colWidths[index];
  });
  
  currentY += 10;
  
  // Driver row with light yellow background
  doc.setFillColor(255, 255, 200); // Light yellow background
  doc.rect(20, currentY, 170, 10, 'F');
  
  x = 20;
  const driverName = driver.name;
  doc.text(driverName, x + 2, currentY + 7);
  x += colWidths[0];
  
  // Fill in the week's schedule
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  daysOfWeek.forEach((day, index) => {
    const dayEntry = entries.find(entry => {
      const entryDay = format(new Date(entry.date), 'EEEE');
      return entryDay === day;
    });
    
    if (dayEntry) {
      const timeRange = `${dayEntry.bookOnTime || 'N/A'}-${dayEntry.bookOffTime || 'N/A'}`;
      doc.text(timeRange, x + 2, currentY + 7);
    } else {
      doc.text('Rest Day', x + 2, currentY + 7);
    }
    x += colWidths[index + 1];
  });
  
  currentY += 20;
  
  // Detailed daily descriptions section
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(driver.name, 20, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 10;
  
  // Add detailed descriptions for each day
  const sortedEntries = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  sortedEntries.forEach(entry => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    const dayName = format(new Date(entry.date), 'EEEE');
    const date = format(new Date(entry.date), 'dd/MM/yyyy');
    
    // Format the duty description similar to Irish Rail format
    let dutyDescription = `${dayName}-book on duty ${entry.bookOnTime || 'N/A'}`;
    
    if (entry.duties) {
      // Clean up the duties text to match Irish Rail format
      let duties = entry.duties;
      
      // Remove common prefixes if they exist
      duties = duties.replace(/^\d{2}:\d{2}\s*Book On\s*-\s*/i, '');
      duties = duties.replace(/^\d{2}:\d{2}\s*Book On\s*/i, '');
      
      // Add travel and route information
      if (entry.routeSegments && entry.routeSegments.length > 0) {
        const routes = entry.routeSegments.map(segment => segment.route).join(' ');
        dutyDescription += ` travel ${routes}`;
      } else {
        dutyDescription += ` travel ${duties}`;
      }
    }
    
    // Bold the day name
    doc.setFont('helvetica', 'bold');
    doc.text(dayName, 20, currentY);
    doc.setFont('helvetica', 'normal');
    
    // Add the rest of the description
    const descriptionX = 20 + doc.getTextWidth(dayName) + 5;
    doc.text(dutyDescription.substring(dayName.length + 1), descriptionX, currentY);
    
    currentY += 8;
  });
  
  // Add disclaimer note
  currentY += 10;
  doc.setFontSize(10);
  doc.setTextColor(255, 0, 0); // Red text
  doc.text('Please Note Roster Subject to change, Check Daily Sheets', 20, currentY);
  
  // Add Irish Rail logo at bottom
  currentY += 20;
  addIrishRailLogo(doc, currentY);
  
  return doc;
}

export function exportTrainingReportPDF(driver: Driver, progress: TrainingProgress, entries: RosterEntry[]) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Training Progress Report', 20, 20);
  doc.setFontSize(12);
  doc.text(`Driver: ${driver.name}`, 20, 35);
  doc.text(`Start Date: ${format(new Date(driver.startDate), 'dd MMM yyyy')}`, 20, 45);
  
  let currentY = 60;
  
  // Training Progress Summary
  doc.setFontSize(14);
  doc.text('Training Progress Summary', 20, currentY);
  currentY += 15;
  
  doc.setFontSize(10);
  const summaryData = [
    ['Total Days Completed', `${progress.traineeDaysCompleted}/70`],
    ['Mainline Days', `${progress.mainlineDaysCompleted}/56`],
    ['Pilot Days', `${progress.pilotDaysCompleted}/14`],
    ['Total Hours', `${Math.round(progress.traineeHoursCompleted)}/250`],
    ['Cork East Trips', `${progress.corkEastCobhTrips + progress.corkEastMidletonTrips}/22`],
    ['Tralee Days', `${progress.traleeLearningDays}/22`],
  ];
  
  summaryData.forEach(([label, value]) => {
    doc.text(label, 20, currentY);
    doc.text(value, 120, currentY);
    currentY += 8;
  });
  
  currentY += 10;
  
  // Route Breakdown
  doc.setFontSize(14);
  doc.text('Route Breakdown', 20, currentY);
  currentY += 15;
  
  doc.setFontSize(10);
  const routeData: [string, number, string][] = [
    ['Mainline Routes', progress.mainlineDaysCompleted, 'Cork-Dublin, Cork-Mallow'],
    ['Pilot Routes', progress.pilotDaysCompleted, 'Yard/Shed work'],
    ['Cork East', progress.corkEastCobhTrips + progress.corkEastMidletonTrips, 'Cobh & Midleton'],
    ['Tralee Routes', progress.traleeLearningDays, 'Tralee line'],
  ];
  
  routeData.forEach(([route, count, description]) => {
    doc.text(route, 20, currentY);
    doc.text(count.toString(), 80, currentY);
    doc.text(description, 100, currentY);
    currentY += 8;
  });
  
  // Recent Activity
  if (entries.length > 0) {
    currentY += 10;
    doc.setFontSize(14);
    doc.text('Recent Activity (Last 10 Entries)', 20, currentY);
    currentY += 15;
    
    doc.setFontSize(8);
    const recentEntries = entries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    
    recentEntries.forEach(entry => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      const date = format(new Date(entry.date), 'dd/MM/yyyy');
      const duty = entry.duties.length > 40 ? entry.duties.substring(0, 40) + '...' : entry.duties;
      
      const routeTypes = entry.routeSegments?.map(segment => segment.routeType).join(', ') || 'N/A';
      doc.text(`${date} - ${routeTypes}`, 20, currentY);
      doc.text(duty, 20, currentY + 4);
      currentY += 10;
    });
  }
  
  return doc;
}

export function exportDriverHistoryPDF(driver: Driver, progress: TrainingProgress, entries: RosterEntry[]) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Driver Training History', 20, 20);
  doc.setFontSize(12);
  doc.text(`Driver: ${driver.name}`, 20, 35);
  doc.text(`Start Date: ${format(new Date(driver.startDate), 'dd MMM yyyy')}`, 20, 45);
  doc.text(`Current Status: ${driver.status}`, 20, 55);
  
  let currentY = 70;
  
  // Complete History Table
  doc.setFontSize(14);
  doc.text('Complete Training History', 20, currentY);
  currentY += 15;
  
  // Table headers
  doc.setFontSize(10);
  doc.setFillColor(240, 240, 240);
  doc.rect(20, currentY, 170, 10, 'F');
  
  const headers = ['Date', 'Day', 'Book On', 'Book Off', 'Route Type', 'Duties'];
  let x = 20;
  const colWidths = [25, 20, 20, 20, 25, 60];
  
  headers.forEach((header, index) => {
    doc.text(header, x + 2, currentY + 7);
    x += colWidths[index];
  });
  
  currentY += 10;
  
  // Add all entries
  const sortedEntries = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  sortedEntries.forEach(entry => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    const dayName = format(new Date(entry.date), 'EEE');
    const routeTypes = entry.routeSegments?.map(segment => segment.routeType).join(', ') || 'N/A';
    
    const rowData = [
      format(new Date(entry.date), 'dd/MM/yyyy'),
      dayName,
      entry.bookOnTime || 'N/A',
      entry.bookOffTime || 'N/A',
      routeTypes,
      entry.duties
    ];
    
    x = 20;
    rowData.forEach((cell, index) => {
      const maxWidth = colWidths[index] - 4;
      const lines = doc.splitTextToSize(cell, maxWidth);
      
      if (lines.length > 1) {
        doc.text(lines[0], x + 2, currentY + 3);
        currentY += 3;
      } else {
        doc.text(cell, x + 2, currentY + 3);
      }
      
      x += colWidths[index];
    });
    
    currentY += 8;
  });
  
  return doc;
} 