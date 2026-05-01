import {
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../lib/api';
import { DriverWeekSummary } from '../pages/driverArea';
import { useDriverWeek } from './DriverWeekContext';

type DriverWeeksResponse = {
  weeks: DriverWeekSummary[];
};

const DriverWeekPicker: React.FC = () => {
  const { token } = useAuth();
  const { selectedWeek, setSelectedWeek } = useDriverWeek();
  const [weeks, setWeeks] = useState<DriverWeekSummary[]>([]);

  useEffect(() => {
    void loadWeeks();
  }, [token]);

  async function loadWeeks() {
    if (!token) {
      return;
    }

    try {
      const response = await apiRequest<DriverWeeksResponse>('/api/v1/weeks', {
        method: 'GET',
        token,
      });

      setWeeks(response.weeks);

      if (response.weeks.length === 0) {
        return;
      }

      const hasSelectedWeek = selectedWeek
        ? response.weeks.some((week) => week.date_key === selectedWeek)
        : false;

      if (!hasSelectedWeek) {
        setSelectedWeek(response.weeks[0].date_key);
      }
    } catch {
      setWeeks([]);
    }
  }

  if (weeks.length === 0) {
    return null;
  }

  return (
    <IonItem lines="none" className="driver-week-picker">
      <IonSelect
        aria-label="Semana"
        interface="action-sheet"
        value={selectedWeek ?? weeks[0]?.date_key}
        onIonChange={(event) => setSelectedWeek(event.detail.value ?? null)}
      >
        {weeks.map((week) => (
          <IonSelectOption key={week.id} value={week.date_key}>
            {week.label}
          </IonSelectOption>
        ))}
      </IonSelect>
    </IonItem>
  );
};

export default DriverWeekPicker;
