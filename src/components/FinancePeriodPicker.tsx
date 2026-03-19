import { IonButton } from '@ionic/react';
import { useFinancePeriod, type FinancePeriodPreset } from './FinancePeriodContext';

const presets: Array<{ key: FinancePeriodPreset; label: string }> = [
  { key: 'current_month', label: 'Este mes' },
  { key: 'last_30_days', label: '30 dias' },
  { key: 'current_year', label: 'Este ano' },
];

const FinancePeriodPicker: React.FC = () => {
  const { preset, startDate, endDate, setPreset, setCustomRange, label } = useFinancePeriod();

  return (
    <section className="dashboard-card finance-period-card">
      <div className="card-head">
        <div>
          <h3>Periodo de analise</h3>
          <p className="finance-period-summary">{label}</p>
        </div>
      </div>

      <div className="finance-period-presets">
        {presets.map((item) => (
          <IonButton
            key={item.key}
            type="button"
            fill={preset === item.key ? 'solid' : 'outline'}
            size="small"
            className="finance-period-chip"
            onClick={() => setPreset(item.key)}
          >
            {item.label}
          </IonButton>
        ))}
      </div>

      <div className="finance-period-range">
        <label className="finance-period-field">
          <span>De</span>
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(event) => setCustomRange(event.target.value, endDate)}
          />
        </label>

        <label className="finance-period-field">
          <span>Ate</span>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(event) => setCustomRange(startDate, event.target.value)}
          />
        </label>
      </div>
    </section>
  );
};

export default FinancePeriodPicker;
