import { createContext, useContext, useMemo, useState } from 'react';

export type FinancePeriodPreset = 'current_month' | 'previous_month' | 'last_3_months' | 'current_year' | 'custom';

type FinancePeriodContextValue = {
  preset: FinancePeriodPreset;
  startDate: string;
  endDate: string;
  setPreset: (preset: FinancePeriodPreset) => void;
  setCustomRange: (startDate: string, endDate: string) => void;
  query: string;
  label: string;
};

const FinancePeriodContext = createContext<FinancePeriodContextValue | undefined>(undefined);

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDateInputValue(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(year, (month || 1) - 1, day || 1);
}

function buildPresetRange(preset: FinancePeriodPreset) {
  const now = new Date();

  if (preset === 'current_month') {
    return {
      startDate: toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)),
      endDate: toDateInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
  }

  if (preset === 'previous_month') {
    return {
      startDate: toDateInputValue(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      endDate: toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 0)),
    };
  }

  if (preset === 'last_3_months') {
    return {
      startDate: toDateInputValue(new Date(now.getFullYear(), now.getMonth() - 2, 1)),
      endDate: toDateInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
  }

  return {
    startDate: toDateInputValue(new Date(now.getFullYear(), 0, 1)),
    endDate: toDateInputValue(new Date(now.getFullYear(), 11, 31)),
  };
}

function formatLabel(startDate: string, endDate: string) {
  const start = parseDateInputValue(startDate);
  const end = parseDateInputValue(endDate);

  const formatter = new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

export function FinancePeriodProvider({ children }: { children: React.ReactNode }) {
  const initialRange = buildPresetRange('current_month');
  const [preset, setPresetState] = useState<FinancePeriodPreset>('current_month');
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);

  const value = useMemo<FinancePeriodContextValue>(() => ({
    preset,
    startDate,
    endDate,
    setPreset(nextPreset) {
      setPresetState(nextPreset);
      if (nextPreset !== 'custom') {
        const range = buildPresetRange(nextPreset);
        setStartDate(range.startDate);
        setEndDate(range.endDate);
      }
    },
    setCustomRange(nextStartDate, nextEndDate) {
      setPresetState('custom');
      setStartDate(nextStartDate);
      setEndDate(nextEndDate);
    },
    query: `data_vencimento_de=${startDate}&data_vencimento_ate=${endDate}`,
    label: formatLabel(startDate, endDate),
  }), [endDate, preset, startDate]);

  return (
    <FinancePeriodContext.Provider value={value}>
      {children}
    </FinancePeriodContext.Provider>
  );
}

export function useFinancePeriod() {
  const context = useContext(FinancePeriodContext);

  if (!context) {
    throw new Error('useFinancePeriod must be used within FinancePeriodProvider');
  }

  return context;
}
