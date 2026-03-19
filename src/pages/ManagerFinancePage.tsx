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
import type { ExpensesResponse, MovementsResponse, ProfitLossResponse } from './managerFinanceArea';
import './Home.css';

type FinanceView = 'profit-loss' | 'movements' | 'expenses';

const subTabs: Array<{ key: FinanceView; label: string }> = [
  { key: 'profit-loss', label: 'DRE' },
  { key: 'movements', label: 'Movimentos' },
  { key: 'expenses', label: 'Despesas' },
];

const ManagerFinancePage: React.FC = () => {
  const { token, user } = useAuth();
  const { query } = useFinancePeriod();
  const [view, setView] = useState<FinanceView>('profit-loss');
  const [profitLoss, setProfitLoss] = useState<ProfitLossResponse | null>(null);
  const [movements, setMovements] = useState<MovementsResponse | null>(null);
  const [expenses, setExpenses] = useState<ExpensesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, [token, query, view]);

  async function loadData() {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (view === 'profit-loss') {
        const payload = await apiRequest<ProfitLossResponse>(`/api/v1/conta-azul/manager/profit-loss?${query}`, {
          method: 'GET',
          token,
        });
        setProfitLoss(payload);
      } else if (view === 'movements') {
        const payload = await apiRequest<MovementsResponse>(`/api/v1/conta-azul/manager/movements?${query}`, {
          method: 'GET',
          token,
        });
        setMovements(payload);
      } else {
        const payload = await apiRequest<ExpensesResponse>(`/api/v1/conta-azul/manager/expenses?${query}`, {
          method: 'GET',
          token,
        });
        setExpenses(payload);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar a area financeira.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    await loadData();
    event.detail.complete();
  }

  const activeCompany =
    (view === 'profit-loss' ? profitLoss?.company.name : null) ||
    (view === 'movements' ? movements?.company.name : null) ||
    (view === 'expenses' ? expenses?.company.name : null) ||
    'Area financeira';

  return (
    <IonPage>
      <DriverPageHeader title="Financeiro" subtitle="DRE, movimentos e despesas" />
      <IonContent fullscreen className="home-page">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="home-shell home-shell-with-tabs">
          <section className="hero-panel">
            <div className="hero-copy-block">
              <p className="hero-eyebrow">Conta Azul</p>
              <h1>{activeCompany}</h1>
              <p className="hero-copy">
                Leitura financeira consolidada para Admin e Gestor, com navegacao interna por DRE, movimentos e despesas.
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

          <section className="dashboard-card finance-subtabs-card">
            <div className="finance-subtabs">
              {subTabs.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`finance-subtab ${view === item.key ? 'finance-subtab-active' : ''}`}
                  onClick={() => setView(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <FinancePeriodPicker />

          {isLoading ? (
            <div className="loading-state">
              <IonSpinner name="crescent" />
            </div>
          ) : null}

          {error ? <article className="dashboard-card dashboard-warning"><h3>Ligacao financeira</h3><p>{error}</p></article> : null}

          {!isLoading && !error && view === 'profit-loss' && profitLoss ? (
            <>
              <section className="dashboard-section">
                <div className="dashboard-metric-grid">
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Receitas</p>
                    <strong>{formatMoney(profitLoss.data.summary.revenue)}</strong>
                    <span>{profitLoss.data.totals.receivables_count} movimentos de entrada</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Despesas</p>
                    <strong>{formatMoney(profitLoss.data.summary.expenses)}</strong>
                    <span>{profitLoss.data.totals.payables_count} movimentos de saida</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Resultado bruto</p>
                    <strong>{formatMoney(profitLoss.data.summary.gross_result)}</strong>
                    <span>Diferenca entre receitas e despesas</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Resultado liquido</p>
                    <strong>{formatMoney(profitLoss.data.summary.net_result)}</strong>
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
                      {profitLoss.data.revenue_categories.length ? profitLoss.data.revenue_categories.map((item) => (
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
                      {profitLoss.data.expense_categories.length ? profitLoss.data.expense_categories.map((item) => (
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

          {!isLoading && !error && view === 'movements' && movements ? (
            <>
              <section className="dashboard-section">
                <div className="dashboard-metric-grid">
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Saldo atual</p>
                    <strong>{formatMoney(movements.data.accounts.totals.current_balance)}</strong>
                    <span>Total consolidado das contas</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Entradas</p>
                    <strong>{formatMoney(movements.data.summary.incoming_total)}</strong>
                    <span>Recebimentos do periodo</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Saidas</p>
                    <strong>{formatMoney(movements.data.summary.outgoing_total)}</strong>
                    <span>Pagamentos do periodo</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Cashflow</p>
                    <strong>{formatMoney(movements.data.summary.net_cashflow)}</strong>
                    <span>{movements.data.summary.movements_count} movimentos agregados</span>
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
                      {movements.data.accounts.items.length ? movements.data.accounts.items.map((account) => (
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
                      {movements.data.movements.length ? movements.data.movements.slice(0, 12).map((movement) => (
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

          {!isLoading && !error && view === 'expenses' && expenses ? (
            <>
              <section className="dashboard-section">
                <div className="dashboard-metric-grid">
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Total</p>
                    <strong>{formatMoney(expenses.data.summary.total_expenses)}</strong>
                    <span>{expenses.data.summary.items_count} despesas</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Em aberto</p>
                    <strong>{formatMoney(expenses.data.summary.open_expenses)}</strong>
                    <span>Despesas por liquidar</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Pagas</p>
                    <strong>{formatMoney(expenses.data.summary.paid_expenses)}</strong>
                    <span>Despesas liquidadas</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Vencidas</p>
                    <strong>{formatMoney(expenses.data.summary.overdue_expenses)}</strong>
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
                      {expenses.data.categories.expense_breakdown.length ? expenses.data.categories.expense_breakdown.map((item) => (
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
                      {expenses.data.items.length ? expenses.data.items.slice(0, 12).map((item) => (
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

export default ManagerFinancePage;
