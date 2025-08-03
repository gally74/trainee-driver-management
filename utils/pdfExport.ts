import jsPDF from 'jspdf';
import { Driver, RosterEntry, TrainingProgress } from '@/types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

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
  
  // Calculate the week range (Monday to Sunday)
  const weekEndingDate = new Date(weekEnding);
  const weekStart = startOfWeek(weekEndingDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(weekEndingDate, { weekStartsOn: 1 }); // Sunday
  
  // Format the date range for the title
  const startDateFormatted = format(weekStart, 'dd MMMM');
  const endDateFormatted = format(weekEnd, 'dd MMMM yyyy');
  
  // Title with driver name and date range
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(`${driver.name} Weekly Roster ${startDateFormatted} - ${endDateFormatted}`, 20, 30);
  doc.setFont('helvetica', 'normal');
  
  // Add Irish Rail logo at top right
  addIrishRailLogo(doc, 25);
  
  let currentY = 50;
  
  // Weekly Schedule Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Weekly Schedule', 20, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 15;
  
  // Table headers
  const headers = ['Day', 'Book On', 'Book Off', 'Hours'];
  doc.setFontSize(10);
  doc.setFillColor(240, 240, 240);
  doc.rect(20, currentY, 170, 10, 'F');
  
  let x = 20;
  const colWidths = [40, 30, 30, 20];
  
  headers.forEach((header, index) => {
    doc.setFont('helvetica', 'bold');
    doc.text(header, x + 5, currentY + 7);
    x += colWidths[index];
  });
  
  currentY += 10;
  
  // Get all days of the week
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  // Fill in the week's schedule
  weekDays.forEach(day => {
    const dayName = format(day, 'EEEE');
    const dayEntry = entries.find(entry => {
      const entryDate = new Date(entry.date);
      return format(entryDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    });
    
    // Alternate row colors
    if (weekDays.indexOf(day) % 2 === 0) {
      doc.setFillColor(248, 249, 250);
      doc.rect(20, currentY, 170, 10, 'F');
    }
    
    x = 20;
    
    // Day name
    doc.setFont('helvetica', 'bold');
    doc.text(dayName, x + 5, currentY + 7);
    x += colWidths[0];
    
    if (dayEntry) {
      // Book on time
      doc.setFont('helvetica', 'normal');
      doc.text(dayEntry.bookOnTime || 'N/A', x + 5, currentY + 7);
      x += colWidths[1];
      
      // Book off time
      doc.text(dayEntry.bookOffTime || 'N/A', x + 5, currentY + 7);
      x += colWidths[2];
      
      // Calculate hours
      if (dayEntry.bookOnTime && dayEntry.bookOffTime) {
        const onTime = dayEntry.bookOnTime;
        const offTime = dayEntry.bookOffTime;
        const hours = calculateHours(onTime, offTime);
        doc.text(hours.toString(), x + 5, currentY + 7);
      } else {
        doc.text('N/A', x + 5, currentY + 7);
      }
    } else {
      // Rest day
      doc.setFont('helvetica', 'normal');
      doc.text('Rest Day', x + 5, currentY + 7);
      x += colWidths[1];
      doc.text('Rest Day', x + 5, currentY + 7);
      x += colWidths[2];
      doc.text('0', x + 5, currentY + 7);
    }
    
    currentY += 10;
  });
  
  currentY += 20;
  
  // Detailed Duties Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Duties', 20, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 15;
  
  // Add detailed descriptions for each day
  const sortedEntries = entries
    .filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekStart && entryDate <= weekEnd;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  sortedEntries.forEach(entry => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    const dayName = format(new Date(entry.date), 'EEEE');
    const date = format(new Date(entry.date), 'dd/MM/yyyy');
    
    // Day header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${dayName} - ${date}`, 20, currentY);
    doc.setFont('helvetica', 'normal');
    currentY += 8;
    
    // Booking times
    doc.setFontSize(10);
    doc.text(`Book On: ${entry.bookOnTime || 'N/A'} | Book Off: ${entry.bookOffTime || 'N/A'}`, 25, currentY);
    currentY += 8;
    
    // Duties description
    if (entry.duties) {
      const duties = entry.duties;
      const maxWidth = 160;
      const lines = doc.splitTextToSize(duties, maxWidth);
      
      lines.forEach((line: string) => {
        doc.text(line, 25, currentY);
        currentY += 5;
      });
    }
    
    // Route information
    if (entry.routeSegments && entry.routeSegments.length > 0) {
      const routes = entry.routeSegments.map(segment => segment.route).join(', ');
      doc.setFont('helvetica', 'italic');
      doc.text(`Routes: ${routes}`, 25, currentY);
      doc.setFont('helvetica', 'normal');
      currentY += 5;
    }
    
    currentY += 10;
  });
  
  // Add rest days that don't have entries
  weekDays.forEach(day => {
    const dayEntry = entries.find(entry => {
      const entryDate = new Date(entry.date);
      return format(entryDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    });
    
    if (!dayEntry) {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      const dayName = format(day, 'EEEE');
      const date = format(day, 'dd/MM/yyyy');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${dayName} - ${date}`, 20, currentY);
      doc.setFont('helvetica', 'normal');
      currentY += 8;
      
      doc.setFontSize(10);
      doc.text('Rest Day - No duties assigned', 25, currentY);
      currentY += 15;
    }
  });
  
  // Add footer note
  currentY += 10;
  doc.setFontSize(10);
  doc.setTextColor(255, 0, 0); // Red text
  doc.text('Please Note: Roster subject to change. Check daily sheets for updates.', 20, currentY);
  
  // Add Irish Rail logo at bottom
  currentY += 20;
  addIrishRailLogo(doc, currentY);
  
  return doc;
}

// Helper function to calculate hours between two times
function calculateHours(onTime: string, offTime: string): number {
  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
  };
  
  const onHours = parseTime(onTime);
  const offHours = parseTime(offTime);
  
  // Handle overnight shifts
  if (offHours < onHours) {
    return (24 - onHours) + offHours;
  }
  
  return offHours - onHours;
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