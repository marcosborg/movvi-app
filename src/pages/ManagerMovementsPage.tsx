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
import { apiRequest } from '../lib/api';
import { formatMoney } from './driverArea';
import { MovementsResponse } from './managerFinanceArea';
import './Home.css';

const ManagerMovementsPage: React.FC = () => {
  const { token, user } = useAuth();
  const [response, setResponse] = useState<MovementsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, [token]);

  async function loadData() {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = await apiRequest<MovementsResponse>('/api/v1/conta-azul/manager/movements', {
        method: 'GET',
        token,
      });
      setResponse(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar os movimentos.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    await loadData();
    event.detail.complete();
  }

  return (
    <IonPage>
      <DriverPageHeader title="Movimentos" subtitle="Extratos e contas financeiras" />
      <IonContent fullscreen className="home-page">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="home-shell home-shell-with-tabs">
          <section className="hero-panel">
            <div className="hero-copy-block">
              <p className="hero-eyebrow">Conta Azul</p>
              <h1>{response?.company.name || 'Movimentos financeiros'}</h1>
              <p className="hero-copy">
                Extrato consolidado de entradas, saidas e saldo das contas financeiras.
              </p>
            </div>
            <div className="hero-side">
              <div className="role-chip-row">
                {(user?.roles ?? []).map((role) => (
                  <span key={role} className="role-chip">{role}</span>
                ))}
              </div>
            </div>
          </section>

          {isLoading ? (
            <div className="loading-state">
              <IonSpinner name="crescent" />
            </div>
          ) : null}

          {error ? <article className="dashboard-card dashboard-warning"><h3>Ligacao financeira</h3><p>{error}</p></article> : null}

          {!isLoading && !error && response ? (
            <>
              <section className="dashboard-section">
                <div className="dashboard-metric-grid">
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Saldo atual</p>
                    <strong>{formatMoney(response.data.accounts.totals.current_balance)}</strong>
                    <span>Total consolidado das contas</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Entradas</p>
                    <strong>{formatMoney(response.data.summary.incoming_total)}</strong>
                    <span>Recebimentos do periodo</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Saidas</p>
                    <strong>{formatMoney(response.data.summary.outgoing_total)}</strong>
                    <span>Pagamentos do periodo</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Cashflow</p>
                    <strong>{formatMoney(response.data.summary.net_cashflow)}</strong>
                    <span>{response.data.summary.movements_count} movimentos agregados</span>
                  </article>
                </div>
              </section>

              <section className="dashboard-section">
                <div className="dashboard-card-grid">
                  <article className="dashboard-card">
                    <div className="card-head">
                      <h3>Contas financeiras</h3>
                    </div>
                    <div className="receipt-list">
                      {response.data.accounts.items.length ? response.data.accounts.items.map((account) => (
                        <div key={account.id || account.name} className="receipt-item">
                          <div>
                            <strong>{account.name}</strong>
                            <span>{account.type || 'Conta'}{account.active === false ? ' - inativa' : ''}</span>
                          </div>
                          <span className="status-badge">{formatMoney(account.balance)}</span>
                        </div>
                      )) : <p className="dashboard-empty">Sem contas financeiras disponiveis.</p>}
                    </div>
                  </article>

                  <article className="dashboard-card">
                    <div className="card-head">
                      <h3>Ultimos movimentos</h3>
                    </div>
                    <div className="receipt-list">
                      {response.data.movements.length ? response.data.movements.slice(0, 12).map((movement) => (
                        <div key={`${movement.direction}-${movement.id}-${movement.date}`} className="receipt-item">
                          <div>
                            <strong>{movement.description}</strong>
                            <span>{movement.counterparty || movement.category || 'Sem detalhe'}{movement.date ? ` - ${movement.date}` : ''}</span>
                          </div>
                          <span className={`status-badge ${movement.direction === 'incoming' ? 'status-available' : 'status-planned'}`}>
                            {formatMoney(movement.amount)}
                          </span>
                        </div>
                      )) : <p className="dashboard-empty">Sem movimentos disponiveis.</p>}
                    </div>
                  </article>
                </div>
              </section>
            </>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ManagerMovementsPage;
