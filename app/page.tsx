'use client';

import { useState } from 'react';
import { useDriverStore } from '@/store/driverStore';
import { DriverCard } from '@/components/DriverCard';
import { AddDriverModal } from '@/components/AddDriverModal';
import { ProgressOverview } from '@/components/ProgressOverview';
import { Plus, Users, TrendingUp, Clock } from 'lucide-react';

export default function Dashboard() {
  const { drivers } = useDriverStore();
  const [showAddDriver, setShowAddDriver] = useState(false);

  const traineeDrivers = drivers.filter(d => d.status === 'trainee');
  const appointedDrivers = drivers.filter(d => d.status === 'appointed');
  const qualifiedDrivers = drivers.filter(d => d.status === 'qualified');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Trainee Driver Management
        </h1>
        <p className="text-gray-600">
          Track training progress and manage driver development
        </p>
      </div>

             {/* Stats Overview */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Drivers</p>
              <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Clock className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Trainees</p>
              <p className="text-2xl font-bold text-gray-900">{traineeDrivers.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Appointed</p>
              <p className="text-2xl font-bold text-gray-900">{appointedDrivers.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Qualified</p>
              <p className="text-2xl font-bold text-gray-900">{qualifiedDrivers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trainee Requirements */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Trainee Requirements</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Mainline Route Requirements */}
          <div className="card">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Mainline Route</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Minimum Days:</span>
                <span className="text-sm font-medium">56 days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Minimum Hours:</span>
                <span className="text-sm font-medium">250 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Route Segments:</span>
                <span className="text-sm font-medium">Dublin - Cork</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Key Stations:</span>
                <span className="text-sm font-medium">Dublin, Kildare, Portlaoise, Limerick Junction, Cork</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Assessment:</span>
                <span className="text-sm font-medium">Final route test required</span>
              </div>
            </div>
          </div>

          {/* Cork East Route Requirements */}
          <div className="card">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Cork East Route</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Minimum Days:</span>
                <span className="text-sm font-medium">30 days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Minimum Hours:</span>
                <span className="text-sm font-medium">240 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Route Segments:</span>
                <span className="text-sm font-medium">Cork - Midleton - Cobh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Key Stations:</span>
                <span className="text-sm font-medium">Cork, Glounthaune, Midleton, Cobh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Assessment:</span>
                <span className="text-sm font-medium">Local route competency</span>
              </div>
            </div>
          </div>

          {/* Tralee Route Requirements */}
          <div className="card">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-orange-100 rounded-lg mr-3">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Tralee Route</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Minimum Days:</span>
                <span className="text-sm font-medium">35 days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Minimum Hours:</span>
                <span className="text-sm font-medium">280 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Route Segments:</span>
                <span className="text-sm font-medium">Cork - Mallow - Tralee</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Key Stations:</span>
                <span className="text-sm font-medium">Cork, Mallow, Killarney, Tralee</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Assessment:</span>
                <span className="text-sm font-medium">Regional route test</span>
              </div>
            </div>
          </div>
        </div>

        {/* General Requirements */}
        <div className="mt-6 card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">General Training Requirements</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Safety Standards</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Signal recognition</li>
                <li>• Emergency procedures</li>
                <li>• Safety protocols</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Technical Skills</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Train handling</li>
                <li>• Speed management</li>
                <li>• Braking techniques</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Route Knowledge</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Station layouts</li>
                <li>• Speed restrictions</li>
                <li>• Platform operations</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Assessment Criteria</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Practical driving test</li>
                <li>• Route knowledge test</li>
                <li>• Safety assessment</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <ProgressOverview />

      {/* Actions */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Driver Progress</h2>
        <button
          onClick={() => setShowAddDriver(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
        </button>
      </div>

      {/* Driver Cards */}
      {drivers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No drivers yet</h3>
          <p className="text-gray-600 mb-4">
            Get started by adding your first trainee driver using the button above
          </p>
        </div>
      ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {drivers.map((driver) => (
            <DriverCard key={driver.id} driver={driver} />
          ))}
        </div>
      )}

             {/* Add Driver Modal */}
       <AddDriverModal
         isOpen={showAddDriver}
         onClose={() => setShowAddDriver(false)}
       />
       </div>
     </div>
   );
 } 