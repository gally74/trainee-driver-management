import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Driver, RosterEntry, TrainingProgress } from '@/types';
import { calculateTrainingProgress } from '@/utils/trainingProgress';

interface DriverStore {
  drivers: Driver[];
  rosterEntries: RosterEntry[];
  addDriver: (driver: Omit<Driver, 'id'>) => void;
  updateDriver: (id: string, updates: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;
  getDriver: (id: string) => Driver | undefined;
  addRosterEntry: (entry: Omit<RosterEntry, 'id'>) => void;
  updateRosterEntry: (id: string, updates: Partial<RosterEntry>) => void;
  deleteRosterEntry: (id: string) => void;
  getRosterEntriesForDriver: (driverId: string) => RosterEntry[];
  getDriverProgress: (driverId: string) => TrainingProgress | undefined;
  importRosterData: (entries: RosterEntry[]) => void;
}

const useDriverStore = create<DriverStore>()(
  persist(
    (set, get) => ({
      drivers: [],
      rosterEntries: [],

      addDriver: (driverData) => {
        const newDriver: Driver = {
          id: Date.now().toString(),
          ...driverData,
        };
        set((state) => ({
          drivers: [...state.drivers, newDriver],
        }));
      },

      updateDriver: (id, updates) => {
        set((state) => ({
          drivers: state.drivers.map((driver) =>
            driver.id === id ? { ...driver, ...updates } : driver
          ),
        }));
      },

      deleteDriver: (id) => {
        set((state) => ({
          drivers: state.drivers.filter((driver) => driver.id !== id),
          rosterEntries: state.rosterEntries.filter((entry) => entry.driverId !== id),
        }));
      },

      getDriver: (id) => {
        return get().drivers.find((driver) => driver.id === id);
      },

      addRosterEntry: (entryData) => {
        const newEntry: RosterEntry = {
          id: Date.now().toString(),
          ...entryData,
        };
        set((state) => ({
          rosterEntries: [...state.rosterEntries, newEntry],
        }));
      },

      updateRosterEntry: (id, updates) => {
        set((state) => ({
          rosterEntries: state.rosterEntries.map((entry) =>
            entry.id === id ? { ...entry, ...updates } : entry
          ),
        }));
      },

      deleteRosterEntry: (id) => {
        set((state) => ({
          rosterEntries: state.rosterEntries.filter((entry) => entry.id !== id),
        }));
      },

      getRosterEntriesForDriver: (driverId) => {
        return get().rosterEntries.filter((entry) => entry.driverId === driverId);
      },

      getDriverProgress: (driverId) => {
        const driver = get().getDriver(driverId);
        const entries = get().getRosterEntriesForDriver(driverId);
        if (!driver) return undefined;
        return calculateTrainingProgress(driver, entries);
      },

      importRosterData: (entries) => {
        set((state) => ({
          rosterEntries: [...state.rosterEntries, ...entries],
        }));
      },
    }),
    {
      name: 'driver-store',
    }
  )
);

export { useDriverStore }; 