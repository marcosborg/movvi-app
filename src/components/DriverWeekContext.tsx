import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'movvi.driver.selected_week';

type DriverWeekContextValue = {
  selectedWeek: string | null;
  setSelectedWeek: (value: string | null) => void;
};

const DriverWeekContext = createContext<DriverWeekContextValue | undefined>(undefined);

export function DriverWeekProvider({ children }: { children: React.ReactNode }) {
  const [selectedWeek, setSelectedWeekState] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));

  useEffect(() => {
    if (selectedWeek) {
      localStorage.setItem(STORAGE_KEY, selectedWeek);
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
  }, [selectedWeek]);

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
