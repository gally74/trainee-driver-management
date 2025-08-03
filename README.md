# Roys Trainee Driver Management System

A comprehensive training management system for trainee train drivers, built with Next.js, TypeScript, and Tailwind CSS.

## Features

### 🚂 **Driver Management**
- Add, edit, and delete trainee drivers
- Track driver status (trainee, appointed, qualified)
- Monitor training progress across different phases

### 📊 **Training Progress Tracking**
- Real-time progress calculation
- Route-specific training requirements
- Visual progress indicators and charts

### 🛤️ **Route-Specific Training**
- **Mainline Route:** 56 days, 250 hours (Dublin - Cork)
- **Cork East Route:** 30 days, 240 hours (Cork - Midleton - Cobh)
- **Tralee Route:** 35 days, 280 hours (Cork - Mallow - Tralee)

### 📅 **Roster Management**
- Weekly roster creation and management
- Book on/off time tracking
- Route detection and classification
- Driving hours calculation

### 📄 **Export Functionality**
- PDF export for weekly rosters
- Training progress reports
- Driver history documentation
- Irish Rail styled formatting

### 🎯 **Training Requirements**
- Safety standards compliance
- Technical skills assessment
- Route knowledge verification
- Assessment criteria tracking

## Technology Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand with persistence
- **PDF Generation:** jsPDF
- **Icons:** Lucide React
- **Date Handling:** date-fns

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone [your-repository-url]
   cd trainee-driver-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── driver/            # Driver detail pages
│   ├── roster/            # Roster management pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── AddDriverModal.tsx
│   ├── DriverCard.tsx
│   ├── ProgressOverview.tsx
│   └── WeeklyRosterBuilder.tsx
├── store/                 # State management
│   └── driverStore.ts
├── types/                 # TypeScript definitions
│   └── index.ts
├── utils/                 # Utility functions
│   ├── pdfExport.ts
│   ├── routeDetection.ts
│   └── trainingProgress.ts
└── public/               # Static assets
```

## Usage

### Adding a Driver
1. Click "Add Driver" on the landing page
2. Fill in driver details (name, start date, current phase)
3. Save to add to the system

### Managing Rosters
1. Navigate to a driver's roster page
2. Add daily entries with duties and times
3. System automatically detects route types
4. Track progress against training requirements

### Exporting Reports
1. Use the export buttons on roster pages
2. Generate PDF reports for training progress
3. Export weekly rosters in Irish Rail format

## Training Requirements

### Mainline Route (Dublin - Cork)
- **Minimum Days:** 56 days
- **Minimum Hours:** 250 hours
- **Key Stations:** Dublin, Kildare, Portlaoise, Limerick Junction, Cork
- **Assessment:** Final route test required

### Cork East Route (Cork - Midleton - Cobh)
- **Minimum Days:** 30 days
- **Minimum Hours:** 240 hours
- **Key Stations:** Cork, Glounthaune, Midleton, Cobh
- **Assessment:** Local route competency

### Tralee Route (Cork - Mallow - Tralee)
- **Minimum Days:** 35 days
- **Minimum Hours:** 280 hours
- **Key Stations:** Cork, Mallow, Killarney, Tralee
- **Assessment:** Regional route test

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is private and proprietary. Access is restricted to authorized personnel only.

## Support

For support or questions, please contact the development team or create an issue in the repository. 
