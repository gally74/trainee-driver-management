'use client';

import { useDriverStore } from '@/store/driverStore';
import { getProgressPercentage } from '@/utils/trainingProgress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function ProgressOverview() {
  const { drivers, getDriverProgress } = useDriverStore();
  
  const traineeDrivers = drivers.filter(d => d.status === 'trainee');
  const appointedDrivers = drivers.filter(d => d.status === 'appointed');
  const qualifiedDrivers = drivers.filter(d => d.status === 'qualified');

  // Calculate average progress for each category
  const averageProgress = {
    trainee: traineeDrivers.length > 0 ? traineeDrivers.reduce((sum, driver) => {
      const progress = getDriverProgress(driver.id);
      return sum + (progress ? getProgressPercentage(progress, 'trainee') : 0);
    }, 0) / traineeDrivers.length : 0,
    appointed: appointedDrivers.length > 0 ? appointedDrivers.reduce((sum, driver) => {
      const progress = getDriverProgress(driver.id);
      return sum + (progress ? getProgressPercentage(progress, 'appointed') : 0);
    }, 0) / appointedDrivers.length : 0,
    'cork-east-learning': 0,
    'tralee-learning': 0,
    'mainline': qualifiedDrivers.length > 0 ? 100 : 0
  };

  const chartData = [
    { name: 'Trainee', progress: Math.round(averageProgress.trainee) },
    { name: 'Appointed', progress: Math.round(averageProgress.appointed) },
    { name: 'Cork East', progress: Math.round(averageProgress['cork-east-learning']) },
    { name: 'Tralee', progress: Math.round(averageProgress['tralee-learning']) },
    { name: 'Mainline', progress: Math.round(averageProgress.mainline) }
  ];

  return (
    <div className="card mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Progress Overview</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => [`${value}%`, 'Progress']}
              labelFormatter={(label) => `${label} Phase`}
            />
            <Bar 
              dataKey="progress" 
              fill="#3B82F6" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600">
            {traineeDrivers.length}
          </div>
          <div className="text-sm text-gray-600">Trainees</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-warning-600">
            {appointedDrivers.length}
          </div>
          <div className="text-sm text-gray-600">Appointed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-success-600">
            {qualifiedDrivers.length}
          </div>
          <div className="text-sm text-gray-600">Qualified</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">
            {Math.round(averageProgress.trainee)}
          </div>
          <div className="text-sm text-gray-600">Avg Progress %</div>
        </div>
      </div>
    </div>
  );
} 