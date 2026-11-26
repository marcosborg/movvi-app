import { createContext, useContext, useState } from 'react';

type DriverWeekContextValue = {
  selectedWeek: string | null;
  setSelectedWeek: (value: string | null) => void;
};

const DriverWeekContext = createContext<DriverWeekContextValue | undefined>(undefined);

export function DriverWeekProvider({ children }: { children: React.ReactNode }) {
  const [selectedWeek, setSelectedWeekState] = useState<string | null>(null);

  return (
    <DriverWeekContext.Provider
      value={{
        selectedWeek,
        setSelectedWeek: setSelectedWeekState,
      }}
    >
      {children}
    </DriverWeekContext.Provider>
  );
}

export function useDriverWeek() {
  const context = useContext(DriverWeekContext);

  if (!context) {
    throw new Error('useDriverWeek must be used within DriverWeekProvider');
  }

  return context;
}
