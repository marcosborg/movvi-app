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
import { ExpensesResponse } from './managerFinanceArea';
import './Home.css';

const ManagerExpensesPage: React.FC = () => {
  const { token, user } = useAuth();
  const [response, setResponse] = useState<ExpensesResponse | null>(null);
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
      const payload = await apiRequest<ExpensesResponse>('/api/v1/conta-azul/manager/expenses', {
        method: 'GET',
        token,
      });
      setResponse(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar as despesas.');
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
      <DriverPageHeader title="Despesas" subtitle="Saidas, pendentes e vencidas" />
      <IonContent fullscreen className="home-page">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="home-shell home-shell-with-tabs">
          <section className="hero-panel">
            <div className="hero-copy-block">
              <p className="hero-eyebrow">Conta Azul</p>
              <h1>{response?.company.name || 'Despesas'}</h1>
              <p className="hero-copy">
                Visao das despesas, valores pendentes, pagos e categorias com maior peso.
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
                    <p className="metric-label">Total</p>
                    <strong>{formatMoney(response.data.summary.total_expenses)}</strong>
                    <span>{response.data.summary.items_count} despesas</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Em aberto</p>
                    <strong>{formatMoney(response.data.summary.open_expenses)}</strong>
                    <span>Despesas por liquidar</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Pagas</p>
                    <strong>{formatMoney(response.data.summary.paid_expenses)}</strong>
                    <span>Despesas liquidadas</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Vencidas</p>
                    <strong>{formatMoney(response.data.summary.overdue_expenses)}</strong>
                    <span>Despesas fora de prazo</span>
                  </article>
                </div>
              </section>

              <section className="dashboard-section">
                <div className="dashboard-card-grid">
                  <article className="dashboard-card">
                    <div className="card-head">
                      <h3>Despesa por categoria</h3>
                    </div>
                    <div className="receipt-list">
                      {response.data.categories.expense_breakdown.length ? response.data.categories.expense_breakdown.map((item) => (
                        <div key={item.category} className="receipt-item">
                          <div>
                            <strong>{item.category}</strong>
                            <span>{item.count} movimentos</span>
                          </div>
                          <span className="status-badge status-planned">{formatMoney(item.amount)}</span>
                        </div>
                      )) : <p className="dashboard-empty">Sem categorias de despesa disponiveis.</p>}
                    </div>
                  </article>

                  <article className="dashboard-card">
                    <div className="card-head">
                      <h3>Ultimas despesas</h3>
                    </div>
                    <div className="receipt-list">
                      {response.data.items.length ? response.data.items.slice(0, 12).map((item) => (
                        <div key={`${item.id}-${item.date}`} className="receipt-item">
                          <div>
                            <strong>{item.description}</strong>
                            <span>{item.counterparty || item.category || 'Sem detalhe'}{item.date ? ` - ${item.date}` : ''}</span>
                          </div>
                          <span className="status-badge status-planned">{formatMoney(item.amount)}</span>
                        </div>
                      )) : <p className="dashboard-empty">Sem despesas disponiveis.</p>}
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

export default ManagerExpensesPage;
