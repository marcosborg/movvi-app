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
import FinancePeriodPicker from '../components/FinancePeriodPicker';
import { useFinancePeriod } from '../components/FinancePeriodContext';
import { apiRequest } from '../lib/api';
import { formatMoney } from './driverArea';
import { ProfitLossResponse } from './managerFinanceArea';
import './Home.css';

const ManagerProfitLossPage: React.FC = () => {
  const { token, user } = useAuth();
  const { query } = useFinancePeriod();
  const [response, setResponse] = useState<ProfitLossResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, [token, query]);

  async function loadData() {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = await apiRequest<ProfitLossResponse>(`/api/v1/conta-azul/manager/profit-loss?${query}`, {
        method: 'GET',
        token,
      });
      setResponse(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar a demonstracao de resultados.');
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
      <DriverPageHeader title="DRE" subtitle="Demonstracao de resultados" />
      <IonContent fullscreen className="home-page">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="home-shell home-shell-with-tabs">
          <section className="hero-panel">
            <div className="hero-copy-block">
              <p className="hero-eyebrow">Conta Azul</p>
              <h1>{response?.company.name || 'Demonstracao de resultados'}</h1>
              <p className="hero-copy">
                Leitura resumida de receita, despesa e resultado para Admin e Gestor.
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

          <FinancePeriodPicker />

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
                    <p className="metric-label">Receitas</p>
                    <strong>{formatMoney(response.data.summary.revenue)}</strong>
                    <span>{response.data.totals.receivables_count} movimentos de entrada</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Despesas</p>
                    <strong>{formatMoney(response.data.summary.expenses)}</strong>
                    <span>{response.data.totals.payables_count} movimentos de saida</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Resultado bruto</p>
                    <strong>{formatMoney(response.data.summary.gross_result)}</strong>
                    <span>Diferenca entre receitas e despesas</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Resultado liquido</p>
                    <strong>{formatMoney(response.data.summary.net_result)}</strong>
                    <span>Estado final do periodo consultado</span>
                  </article>
                </div>
              </section>

              <section className="dashboard-section">
                <div className="dashboard-card-grid">
                  <article className="dashboard-card">
                    <div className="card-head">
                      <h3>Receitas por categoria</h3>
                    </div>
                    <div className="receipt-list">
                      {response.data.revenue_categories.length ? response.data.revenue_categories.map((item) => (
                        <div key={item.category} className="receipt-item">
                          <div>
                            <strong>{item.category}</strong>
                            <span>{item.count} movimentos</span>
                          </div>
                          <span className="status-badge status-available">{formatMoney(item.amount)}</span>
                        </div>
                      )) : <p className="dashboard-empty">Sem receitas disponiveis.</p>}
                    </div>
                  </article>

                  <article className="dashboard-card">
                    <div className="card-head">
                      <h3>Despesas por categoria</h3>
                    </div>
                    <div className="receipt-list">
                      {response.data.expense_categories.length ? response.data.expense_categories.map((item) => (
                        <div key={item.category} className="receipt-item">
                          <div>
                            <strong>{item.category}</strong>
                            <span>{item.count} movimentos</span>
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

export default ManagerProfitLossPage;
