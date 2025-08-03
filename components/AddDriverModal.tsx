'use client';

import { useState } from 'react';
import { useDriverStore } from '@/store/driverStore';
import { TrainingPhase, DriverStatus } from '@/types';
import { X } from 'lucide-react';

interface AddDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddDriverModal({ isOpen, onClose }: AddDriverModalProps) {
  const { addDriver } = useDriverStore();
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    currentPhase: 'trainee',
    status: 'trainee'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    addDriver({
      name: formData.name.trim(),
      startDate: formData.startDate,
      currentPhase: formData.currentPhase as TrainingPhase,
      status: formData.status as DriverStatus
    });

    // Reset form
    setFormData({
      name: '',
      startDate: '',
      currentPhase: 'trainee',
      status: 'trainee'
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Add New Driver</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Driver Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter driver name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.startDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.startDate && (
              <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
            )}
          </div>

          <div>
            <label htmlFor="currentPhase" className="block text-sm font-medium text-gray-700 mb-1">
              Current Phase
            </label>
            <select
              id="currentPhase"
              value={formData.currentPhase}
              onChange={(e) => setFormData({ ...formData, currentPhase: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="trainee">Trainee</option>
              <option value="appointed">Appointed Driver</option>
              <option value="cork-east-learning">Cork East Learning</option>
              <option value="cork-east-solo">Cork East Solo</option>
              <option value="tralee-learning">Tralee Learning</option>
              <option value="tralee-solo">Tralee Solo</option>
              <option value="mainline">Mainline Driver</option>
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="trainee">Trainee</option>
              <option value="appointed">Appointed</option>
              <option value="qualified">Qualified</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Add Driver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 