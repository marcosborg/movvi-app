import {
  IonButton,
  IonContent,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
} from '@ionic/react';
import type { RefresherEventDetail } from '@ionic/core';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import DriverWeekPicker from '../components/DriverWeekPicker';
import { useDriverWeek } from '../components/DriverWeekContext';
import DriverPageHeader from '../components/DriverPageHeader';
import { apiRequest } from '../lib/api';
import { DriverDashboardResponse, formatMoney } from './driverArea';
import './Home.css';

const DriverOverviewPage: React.FC = () => {
  const { token, logout, user } = useAuth();
  const { selectedWeek } = useDriverWeek();
  const [dashboard, setDashboard] = useState<DriverDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadDashboard();
  }, [token, selectedWeek]);

  async function loadDashboard() {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const query = selectedWeek ? `?date=${encodeURIComponent(selectedWeek)}` : '';
      const response = await apiRequest<DriverDashboardResponse>(`/api/v1/mobile/dashboard${query}`, {
        method: 'GET',
        token,
      });
      setDashboard(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar o resumo.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    await loadDashboard();
    event.detail.complete();
  }

  const driverHub = dashboard?.driver_hub;
  const activeRoles = dashboard?.viewer.roles ?? user?.roles ?? [];

  return (
    <IonPage>
      <DriverPageHeader title="Resumo" />
      <IonContent fullscreen className="home-page">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="home-shell home-shell-with-tabs">
          <DriverWeekPicker />
          <section className="hero-panel">
            <div className="hero-copy-block">
              <p className="hero-eyebrow">Driver</p>
              <h1>{driverHub?.driver?.name || dashboard?.viewer.name || 'Area do motorista'}</h1>
              <p className="hero-copy">
                {driverHub?.driver?.company?.name || 'Sem empresa associada'}
              </p>
              <p className="hero-copy hero-copy-muted">
                Esta area replica o percurso principal do motorista no backoffice: resumo semanal, extrato, recibos e documentos.
              </p>
            </div>
            <div className="hero-side">
              <div className="role-chip-row">
                {activeRoles.map((role) => (
                  <span key={role} className="role-chip">
                    {role}
                  </span>
                ))}
              </div>
              <div className="dashboard-actions">
                <IonButton fill="outline" routerLink="/tabs/account">
                  Conta
                </IonButton>
                <IonButton fill="outline" routerLink="/tabs/home">
                  Voltar a publico
                </IonButton>
                <IonButton fill="clear" onClick={logout}>
                  Terminar sessao
                </IonButton>
              </div>
            </div>
          </section>

          {isLoading ? (
            <div className="loading-state">
              <IonSpinner name="crescent" />
            </div>
          ) : null}

          {error ? <p className="status-error">{error}</p> : null}

          {!isLoading && !error && driverHub ? (
            <>
              {driverHub.status === 'configuration_required' ? (
                <article className="dashboard-card dashboard-warning">
                  <h3>Associacao em falta</h3>
                  <p>{driverHub.reason}</p>
                </article>
              ) : (
                <>
                  <section className="dashboard-section">
                    <div className="dashboard-metric-grid">
                      <article className="dashboard-card dashboard-metric-card">
                        <p className="metric-label">Semana</p>
                        <strong>{driverHub.week.number ?? '-'}</strong>
                        <span>{driverHub.week.start_date} a {driverHub.week.end_date}</span>
                      </article>
                      <article className="dashboard-card dashboard-metric-card">
                        <p className="metric-label">Valor da semana</p>
                        <strong>{formatMoney(driverHub.statement_metrics?.total)}</strong>
                        <span>Total do extrato semanal</span>
                      </article>
                      <article className="dashboard-card dashboard-metric-card">
                        <p className="metric-label">Saldo atual</p>
                        <strong>{formatMoney(driverHub.balance?.new_balance)}</strong>
                        <span>Saldo antes de impostos finais</span>
                      </article>
                      <article className="dashboard-card dashboard-metric-card">
                        <p className="metric-label">Saldo final</p>
                        <strong>{formatMoney(driverHub.balance?.final)}</strong>
                        <span>Com IVA e retencao aplicados</span>
                      </article>
                      <article className="dashboard-card dashboard-metric-card">
                        <p className="metric-label">KM da semana</p>
                        <strong>{(driverHub.statement_metrics?.weekly_km ?? 0).toFixed(1)} km</strong>
                        <span>Quilometros atribuidos a esta semana</span>
                      </article>
                      <article className="dashboard-card dashboard-metric-card">
                        <p className="metric-label">Valor por km</p>
                        <strong>{formatMoney(driverHub.statement_metrics?.earnings_per_km)}/km</strong>
                        <span>Relacao entre total e quilometros</span>
                      </article>
                    </div>
                  </section>

                  <section className="dashboard-section">
                    <div className="dashboard-card-grid">
                      <article className="dashboard-card">
                        <div className="card-head">
                          <h3>Perfil do motorista</h3>
                          <span className="status-pill">Ativo</span>
                        </div>
                        <p>Codigo: {driverHub.driver?.code || 'n/a'}</p>
                        <p>Email: {driverHub.driver?.email || 'Sem email'}</p>
                        <p>Telefone: {driverHub.driver?.phone || 'Sem telefone'}</p>
                        <p>Viatura atual: {driverHub.vehicle?.license_plate || 'Nao atribuida'}</p>
                      </article>

                      <article className="dashboard-card">
                        <div className="card-head">
                          <h3>Recibos recentes</h3>
                          <span className="status-pill">{driverHub.recent_receipts.length}</span>
                        </div>
                        {driverHub.recent_receipts.length > 0 ? (
                          <div className="receipt-list">
                            {driverHub.recent_receipts.map((receipt) => (
                              <div key={receipt.id} className="receipt-item">
                                <div>
                                  <strong>{formatMoney(receipt.value)}</strong>
                                  <span>{receipt.created_at || 'Sem data'}</span>
                                </div>
                                <span className={`status-badge ${receipt.paid ? 'status-available' : 'status-planned'}`}>
                                  {receipt.paid ? 'Pago' : receipt.verified ? 'Validado' : 'Pendente'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="dashboard-empty">Ainda nao existem recibos recentes.</p>
                        )}
                      </article>

                      <article className="dashboard-card">
                        <div className="card-head">
                          <h3>Acoes disponiveis</h3>
                        </div>
                        <div className="receipt-list">
                          {driverHub.actions.map((action) => (
                            <div key={action.key} className="receipt-item action-item">
                              <div>
                                <strong>{action.title}</strong>
                                <span>{action.summary}</span>
                              </div>
                              <span className={`status-badge status-${action.status}`}>
                                {action.status === 'available' ? 'Disponivel' : 'Planeado'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </article>
                    </div>
                  </section>
                </>
              )}
            </>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DriverOverviewPage;
