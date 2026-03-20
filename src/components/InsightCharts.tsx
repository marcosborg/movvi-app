type ChartItem = {
  label: string;
  value: number;
  formattedValue?: string;
  helper?: string | null;
  tone?: 'neutral' | 'positive' | 'warm';
};

type HorizontalMetricChartProps = {
  title: string;
  items: ChartItem[];
  emptyText: string;
};

const toneClassMap: Record<NonNullable<ChartItem['tone']>, string> = {
  neutral: 'insight-chart-fill-neutral',
  positive: 'insight-chart-fill-positive',
  warm: 'insight-chart-fill-warm',
};

export const HorizontalMetricChart: React.FC<HorizontalMetricChartProps> = ({ title, items, emptyText }) => {
  const maxValue = items.reduce((best, item) => Math.max(best, Math.abs(item.value)), 0);

  return (
    <article className="dashboard-card insight-chart-card">
      <div className="card-head">
        <h3>{title}</h3>
      </div>
      <div className="insight-chart-list">
        {items.length ? items.map((item) => {
          const width = maxValue > 0 ? Math.max((Math.abs(item.value) / maxValue) * 100, 6) : 0;
          const toneClass = toneClassMap[item.tone ?? 'neutral'];

          return (
            <div key={`${title}-${item.label}`} className="insight-chart-row">
              <div className="insight-chart-copy">
                <strong>{item.label}</strong>
                {item.helper ? <span>{item.helper}</span> : null}
              </div>
              <div className="insight-chart-track">
                <span className={`insight-chart-fill ${toneClass}`} style={{ width: `${width}%` }} />
              </div>
              <span className="insight-chart-value">{item.formattedValue ?? item.value.toString()}</span>
            </div>
          );
        }) : <p className="dashboard-empty">{emptyText}</p>}
      </div>
    </article>
  );
};
