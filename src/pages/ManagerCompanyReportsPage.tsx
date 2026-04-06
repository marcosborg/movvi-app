import {
  IonContent,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
} from '@ionic/react';
import type { RefresherEventDetail } from '@ionic/core';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import DriverPageHeader from '../components/DriverPageHeader';
import DriverWeekPicker from '../components/DriverWeekPicker';
import { useDriverWeek } from '../components/DriverWeekContext';
import { HorizontalMetricChart } from '../components/InsightCharts';
import { apiRequest } from '../lib/api';
import { formatKm, formatMoney } from './driverArea';
import type { CompanyReportResponse } from './managerFinanceArea';
import './Home.css';

type ReportDriver = CompanyReportResponse['data']['drivers'][number];

const ManagerCompanyReportsPage: React.FC = () => {
  const { token, user } = useAuth();
  const { selectedWeek } = useDriverWeek();
  const [response, setResponse] = useState<CompanyReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, [token, selectedWeek]);

  async function loadData() {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const query = selectedWeek ? `?date=${encodeURIComponent(selectedWeek)}` : '';
      const payload = await apiRequest<CompanyReportResponse>(`/api/v1/company-reports/weekly${query}`, {
        method: 'GET',
        token,
      });
      setResponse(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar o relatorio semanal.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    await loadData();
    event.detail.complete();
  }

  const rankedDrivers = response ? [...response.data.drivers].sort((left, right) => right.total - left.total) : [];
  const topRevenueDriver = rankedDrivers[0] ?? null;
  const topEfficiencyDriver = rankedDrivers.reduce<ReportDriver | null>((best, driver) => {
    if (!best || driver.earnings_per_km > best.earnings_per_km) {
      return driver;
    }

    return best;
  }, null);
  const topDistanceDriver = rankedDrivers.reduce<ReportDriver | null>((best, driver) => {
    if (!best || driver.weekly_km > best.weekly_km) {
      return driver;
    }

    return best;
  }, null);

  return (
    <IonPage>
      <DriverPageHeader title="Relatorios" subtitle="Company reports semanal" />
      <IonContent fullscreen className="home-page">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="home-shell home-shell-with-tabs">
          <DriverWeekPicker />

          <section className="hero-panel report-hero-panel">
            <div className="hero-copy-block">
              <p className="hero-eyebrow">Company Reports</p>
              <h1>{response?.company.name || 'Relatorio semanal'}</h1>
              <p className="hero-copy">
                Uma leitura executiva da operacao semanal, com foco em liquidos por operador, quilometros, eficiencia e saldos por motorista.
              </p>
            </div>
            <div className="hero-side">
              <div className="role-chip-row">
                {(user?.roles ?? []).map((role) => (
                  <span key={role} className="role-chip">{role}</span>
                ))}
              </div>
              <div className="submission-meta">
                <span>Semana {response?.week.number ?? '-'}</span>
                <span>{response?.week.start_date || '-'} a {response?.week.end_date || '-'}</span>
                <span>{rankedDrivers.length} motoristas</span>
              </div>
            </div>
          </section>

          {isLoading ? (
            <div className="loading-state">
              <IonSpinner name="crescent" />
            </div>
          ) : null}

          {error ? (
            <article className="dashboard-card dashboard-warning">
              <h3>Relatorio semanal</h3>
              <p>{error}</p>
            </article>
          ) : null}

          {!isLoading && !error && response ? (
            <>
              <section className="dashboard-section">
                <div className="dashboard-metric-grid">
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Liquido Uber</p>
                    <strong>{formatMoney(response.data.totals.net_uber)}</strong>
                    <span>Total semanal do operador Uber</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Liquido Bolt</p>
                    <strong>{formatMoney(response.data.totals.net_bolt)}</strong>
                    <span>Total semanal do operador Bolt</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Quilometros</p>
                    <strong>{formatKm(response.data.totals.total_weekly_km)}</strong>
                    <span>Distancia atribuida a viaturas e motoristas</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">EUR/km</p>
                    <strong>{formatMoney(response.data.totals.total_earnings_per_km)}/km</strong>
                    <span>Media consolidada do relatorio</span>
                  </article>
                </div>
              </section>

              <section className="dashboard-section">
                <div className="dashboard-metric-grid">
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Alugueres</p>
                    <strong>{formatMoney(response.data.totals.total_car_hire)}</strong>
                    <span>Total de aluguer efetivo recebido</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Percentagens</p>
                    <strong>{formatMoney(response.data.totals.total_percent_value)}</strong>
                    <span>Total de percentagem cobrada</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Ajustes operacionais</p>
                    <strong>{formatMoney(response.data.totals.total_adjustments)}</strong>
                    <span>Ajustes gerais e fat. minima</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Receita operacional</p>
                    <strong>{formatMoney(
                      response.data.totals.total_car_hire
                      + response.data.totals.total_percent_value
                      + response.data.totals.total_adjustments
                    )}</strong>
                    <span>Leitura de socios por tipo de recebimento</span>
                  </article>
                </div>
              </section>

              <section className="dashboard-section">
                <div className="dashboard-metric-grid">
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Ajustes gerais</p>
                    <strong>{formatMoney(response.data.totals.total_general_adjustments ?? 0)}</strong>
                    <span>Acertos manuais e gerais</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Fat. minima</p>
                    <strong>{formatMoney(response.data.totals.total_minimum_billing_difference ?? 0)}</strong>
                    <span>Debito por minimo nao atingido</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Abatimento aluguer</p>
                    <strong>{formatMoney(response.data.totals.total_rent_discounts ?? 0)}</strong>
                    <span>Reducao aplicada ao aluguer</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Caucoes</p>
                    <strong>{formatMoney((response.data.totals.total_caution_received ?? 0) + (response.data.totals.total_caution_returned ?? 0))}</strong>
                    <span>
                      Recebida {formatMoney(response.data.totals.total_caution_received ?? 0)} · Devolvida {formatMoney(response.data.totals.total_caution_returned ?? 0)}
                    </span>
                  </article>
                </div>
              </section>

              <section className="dashboard-section">
                <div className="dashboard-card-grid">
                  <HorizontalMetricChart
                    title="Operadores"
                    emptyText="Sem valores por operador."
                    items={[
                      {
                        label: 'Uber',
                        value: response.data.totals.net_uber,
                        formattedValue: formatMoney(response.data.totals.net_uber),
                        helper: 'Liquido semanal',
                        tone: 'neutral',
                      },
                      {
                        label: 'Bolt',
                        value: response.data.totals.net_bolt,
                        formattedValue: formatMoney(response.data.totals.net_bolt),
                        helper: 'Liquido semanal',
                        tone: 'warm',
                      },
                    ]}
                  />
                  <HorizontalMetricChart
                    title="Top faturacao"
                    emptyText="Sem motoristas disponiveis."
                    items={rankedDrivers.slice(0, 6).map((driver) => ({
                      label: driver.name,
                      value: driver.total,
                      formattedValue: formatMoney(driver.total),
                      helper: driver.license_plate || 'Sem viatura atribuida',
                      tone: 'neutral',
                    }))}
                  />
                  <HorizontalMetricChart
                    title="Top quilometros"
                    emptyText="Sem quilometros atribuidos."
                    items={[...rankedDrivers]
                      .sort((left, right) => right.weekly_km - left.weekly_km)
                      .slice(0, 6)
                      .map((driver) => ({
                        label: driver.name,
                        value: driver.weekly_km,
                        formattedValue: formatKm(driver.weekly_km),
                        helper: driver.license_plate || 'Sem viatura atribuida',
                        tone: 'positive',
                      }))}
                  />
                  <HorizontalMetricChart
                    title="Top eur/km"
                    emptyText="Sem dados de eficiencia."
                    items={[...rankedDrivers]
                      .filter((driver) => driver.earnings_per_km > 0)
                      .sort((left, right) => right.earnings_per_km - left.earnings_per_km)
                      .slice(0, 6)
                      .map((driver) => ({
                        label: driver.name,
                        value: driver.earnings_per_km,
                        formattedValue: `${formatMoney(driver.earnings_per_km)}/km`,
                        helper: formatKm(driver.weekly_km),
                        tone: 'warm',
                      }))}
                  />
                </div>
              </section>

              <section className="dashboard-section">
                <div className="dashboard-section-heading">
                  <div>
                    <p className="hero-eyebrow">Destaques</p>
                    <h2>Leitura rapida da semana</h2>
                  </div>
                </div>
                <div className="dashboard-card-grid">
                  <article className="dashboard-card report-highlight-card">
                    <div className="card-head">
                      <h3>Maior faturacao</h3>
                      <span className="status-pill">Top 1</span>
                    </div>
                    {topRevenueDriver ? (
                      <>
                        <strong className="report-highlight-value">{topRevenueDriver.name}</strong>
                        <p>{formatMoney(topRevenueDriver.total)} na semana</p>
                        <span className="report-highlight-meta">{topRevenueDriver.license_plate || 'Sem viatura atribuida'}</span>
                      </>
                    ) : (
                      <p className="dashboard-empty">Sem dados disponiveis.</p>
                    )}
                  </article>

                  <article className="dashboard-card report-highlight-card">
                    <div className="card-head">
                      <h3>Melhor EUR/km</h3>
                      <span className="status-pill">Eficiencia</span>
                    </div>
                    {topEfficiencyDriver ? (
                      <>
                        <strong className="report-highlight-value">{topEfficiencyDriver.name}</strong>
                        <p>{formatMoney(topEfficiencyDriver.earnings_per_km)}/km</p>
                        <span className="report-highlight-meta">{formatKm(topEfficiencyDriver.weekly_km)} atribuidos</span>
                      </>
                    ) : (
                      <p className="dashboard-empty">Sem dados disponiveis.</p>
                    )}
                  </article>

                  <article className="dashboard-card report-highlight-card">
                    <div className="card-head">
                      <h3>Maior distancia</h3>
                      <span className="status-pill">Ritmo</span>
                    </div>
                    {topDistanceDriver ? (
                      <>
                        <strong className="report-highlight-value">{topDistanceDriver.name}</strong>
                        <p>{formatKm(topDistanceDriver.weekly_km)} na semana</p>
                        <span className="report-highlight-meta">{formatMoney(topDistanceDriver.total)} totais</span>
                      </>
                    ) : (
                      <p className="dashboard-empty">Sem dados disponiveis.</p>
                    )}
                  </article>
                </div>
              </section>

              <section className="dashboard-section">
                <div className="dashboard-card report-rank-card">
                  <div className="card-head">
                    <h3>Ranking rapido</h3>
                    <span className="status-pill">Top 5</span>
                  </div>
                  <div className="receipt-list">
                    {rankedDrivers.slice(0, 5).map((driver, index) => (
                      <div key={driver.id} className="receipt-item">
                        <div className="report-rank-main">
                          <span className="report-rank-number">{index + 1}</span>
                          <div>
                            <strong>{driver.name}</strong>
                            <span>{driver.license_plate || 'Sem viatura atribuida'} - {formatKm(driver.weekly_km)}</span>
                          </div>
                        </div>
                        <div className="receipt-meta-col">
                          <strong>{formatMoney(driver.total)}</strong>
                          <span>{formatMoney(driver.earnings_per_km)}/km</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="dashboard-section">
                <div className="dashboard-card">
                  <div className="card-head">
                    <h3>Motoristas</h3>
                    <span className="status-pill">{rankedDrivers.length}</span>
                  </div>
                  <div className="receipt-list">
                    {rankedDrivers.map((driver, index) => (
                      <div key={driver.id} className="receipt-item receipt-item-stacked report-driver-card">
                        <div className="report-driver-head">
                          <div className="receipt-item-main">
                            <div className="report-driver-title-row">
                              <span className="report-rank-number report-rank-number-soft">{index + 1}</span>
                              <strong>{driver.name}</strong>
                            </div>
                            <span>{driver.license_plate || 'Sem viatura atribuida'}</span>
                          </div>
                          <span className={`status-badge ${driver.validated ? 'status-available' : 'status-planned'}`}>
                            {driver.validated ? 'Validado' : 'Pendente'}
                          </span>
                        </div>

                        <div className="report-chip-row">
                          <span className="status-badge">{driver.manual_status_label || 'Sem estado'}</span>
                          <span className="status-badge">Uber {formatMoney(driver.uber_net)}</span>
                          <span className="status-badge">Bolt {formatMoney(driver.bolt_net)}</span>
                          <span className="status-badge">{formatKm(driver.weekly_km)}</span>
                          <span className="status-badge">{formatMoney(driver.earnings_per_km)}/km</span>
                        </div>

                        <div className="report-summary-grid">
                          <span>Total: {formatMoney(driver.total)}</span>
                          <span>Gorjetas: {formatMoney(driver.tips_total)}</span>
                          <span>Taxa: {formatMoney(driver.vat_value)}</span>
                          <span>Abastecimento: {formatMoney(driver.fuel)}</span>
                          <span>Via Verde: {formatMoney(driver.via_verde)}</span>
                          <span>Ajustes: {formatMoney(driver.adjustments)}</span>
                          <span>Ajustes gerais: {formatMoney(driver.general_adjustments ?? driver.adjustments)}</span>
                          <span>Fat. minima: {formatMoney(driver.diferenca_faturacao_minima ?? 0)}</span>
                          <span>Percentagem: {formatMoney(driver.percent_value)}</span>
                          <span>Aluguer: {formatMoney(driver.car_hire)}</span>
                          <span>Abatimento aluguer: {formatMoney(driver.abatimento_aluguer ?? 0)}</span>
                          <span>Caucao recebida: {formatMoney(driver.caucao_recebida ?? 0)}</span>
                          <span>Caucao devolvida: {formatMoney(driver.caucao_devolvida ?? 0)}</span>
                          <span>Ultimo saldo: {formatMoney(driver.last_balance)}</span>
                          <span>Novo saldo: {formatMoney(driver.new_balance)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ManagerCompanyReportsPage;
