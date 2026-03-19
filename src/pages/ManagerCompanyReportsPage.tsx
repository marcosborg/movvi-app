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
import { apiRequest } from '../lib/api';
import { formatMoney } from './driverArea';
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
                    <strong>{response.data.totals.total_weekly_km.toFixed(1)} km</strong>
                    <span>Distancia atribuida a viaturas e motoristas</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">€/km</p>
                    <strong>{formatMoney(response.data.totals.total_earnings_per_km)}/km</strong>
                    <span>Media consolidada do relatorio</span>
                  </article>
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
                      <h3>Melhor €/km</h3>
                      <span className="status-pill">Eficiência</span>
                    </div>
                    {topEfficiencyDriver ? (
                      <>
                        <strong className="report-highlight-value">{topEfficiencyDriver.name}</strong>
                        <p>{formatMoney(topEfficiencyDriver.earnings_per_km)}/km</p>
                        <span className="report-highlight-meta">{topEfficiencyDriver.weekly_km.toFixed(1)} km atribuídos</span>
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
                        <p>{topDistanceDriver.weekly_km.toFixed(1)} km na semana</p>
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
                            <span>{driver.license_plate || 'Sem viatura atribuida'} · {driver.weekly_km.toFixed(1)} km</span>
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
                          <span className="status-badge">Uber {formatMoney(driver.uber_net)}</span>
                          <span className="status-badge">Bolt {formatMoney(driver.bolt_net)}</span>
                          <span className="status-badge">{driver.weekly_km.toFixed(1)} km</span>
                          <span className="status-badge">{formatMoney(driver.earnings_per_km)}/km</span>
                        </div>

                        <div className="report-summary-grid">
                          <span>Total: {formatMoney(driver.total)}</span>
                          <span>Gorjetas: {formatMoney(driver.tips_total)}</span>
                          <span>Taxa: {formatMoney(driver.vat_value)}</span>
                          <span>Abastecimento: {formatMoney(driver.fuel)}</span>
                          <span>Via Verde: {formatMoney(driver.via_verde)}</span>
                          <span>Ajustes: {formatMoney(driver.adjustments)}</span>
                          <span>Percentagem: {formatMoney(driver.percent_value)}</span>
                          <span>Aluguer: {formatMoney(driver.car_hire)}</span>
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
