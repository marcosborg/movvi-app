import {
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonModal,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSelect,
  IonSelectOption,
  IonSpinner,
} from '@ionic/react';
import type { RefresherEventDetail } from '@ionic/core';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import DriverPageHeader from '../components/DriverPageHeader';
import FinancePeriodPicker from '../components/FinancePeriodPicker';
import { useFinancePeriod } from '../components/FinancePeriodContext';
import { HorizontalMetricChart } from '../components/InsightCharts';
import { apiRequest } from '../lib/api';
import { formatMoney } from './driverArea';
import type {
  ExpensesResponse,
  FinancialMovementItem,
  MovementsResponse,
  ProfitLossResponse,
  VehicleRevenueExportResponse,
  VehicleRevenueExportsStatusResponse,
  WeekSummary,
} from './managerFinanceArea';
import './Home.css';

type FinanceView = 'profit-loss' | 'movements' | 'expenses';
type ProfitLossModalKind = 'receivables' | 'payables' | null;
type ExportModalState = {
  isOpen: boolean;
  isSubmitting: boolean;
  isLoadingHistory: boolean;
  error: string | null;
  success: string | null;
  result: VehicleRevenueExportResponse | null;
  status: VehicleRevenueExportsStatusResponse | null;
};
type FinanceConnectionStatus = {
  company: {
    id: number;
    name: string;
  };
  connection: {
    enabled: boolean;
    configured: boolean;
    connected: boolean;
    disabled_message: string | null;
    last_error: string | null;
  };
};

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
  const [profitLossModal, setProfitLossModal] = useState<ProfitLossModalKind>(null);
  const [connectionStatus, setConnectionStatus] = useState<FinanceConnectionStatus | null>(null);
  const [availableWeeks, setAvailableWeeks] = useState<WeekSummary[]>([]);
  const [isLoadingWeeks, setIsLoadingWeeks] = useState(false);
  const [selectedExportWeekId, setSelectedExportWeekId] = useState<number | null>(null);
  const [exportModal, setExportModal] = useState<ExportModalState>({
    isOpen: false,
    isSubmitting: false,
    isLoadingHistory: false,
    error: null,
    success: null,
    result: null,
    status: null,
  });

  const isAdmin = (user?.roles ?? []).includes('Admin');

  useEffect(() => {
    void loadData();
  }, [token, query, view]);

  useEffect(() => {
    setProfitLossModal(null);
  }, [view, query]);

  useEffect(() => {
    if (!exportModal.isOpen || availableWeeks.length > 0) {
      return;
    }

    void loadWeeks();
  }, [exportModal.isOpen]);

  useEffect(() => {
    if (!exportModal.isOpen || !selectedExportWeekId) {
      return;
    }

    void loadVehicleRevenueExportStatus(selectedExportWeekId);
  }, [exportModal.isOpen, selectedExportWeekId]);

  async function loadData() {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setProfitLoss(null);
    setMovements(null);
    setExpenses(null);

    try {
      const status = await apiRequest<FinanceConnectionStatus>('/api/v1/conta-azul/status', {
        method: 'GET',
        token,
      });
      setConnectionStatus(status);

      if (!status.connection.enabled) {
        setError(status.connection.disabled_message || 'Integracao financeira desativada neste ambiente.');
        return;
      }

      if (!status.connection.connected) {
        setError(status.connection.last_error || 'A ligacao Conta Azul nao esta ativa para esta empresa.');
        return;
      }

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

  async function loadWeeks() {
    if (!token) {
      return;
    }

    setIsLoadingWeeks(true);

    try {
      const response = await apiRequest<{ weeks: WeekSummary[] }>('/api/v1/weeks', {
        method: 'GET',
        token,
      });

      setAvailableWeeks(response.weeks);
      setSelectedExportWeekId((current) => current ?? response.weeks[0]?.id ?? null);
    } catch (loadWeeksError) {
      setAvailableWeeks([]);
      setExportModal((current) => ({
        ...current,
        error: loadWeeksError instanceof Error ? loadWeeksError.message : 'Nao foi possivel carregar as semanas.',
      }));
    } finally {
      setIsLoadingWeeks(false);
    }
  }

  async function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    await loadData();
    event.detail.complete();
  }

  async function loadVehicleRevenueExportStatus(weekId: number) {
    if (!token) {
      return;
    }

    setExportModal((current) => ({
      ...current,
      isLoadingHistory: true,
      error: null,
    }));

    try {
      const response = await apiRequest<VehicleRevenueExportsStatusResponse>(
        `/api/v1/conta-azul/manager/vehicle-revenue-exports?tvde_week_id=${weekId}`,
        {
          method: 'GET',
          token,
        },
      );

      setExportModal((current) => ({
        ...current,
        isLoadingHistory: false,
        status: response,
      }));
    } catch (statusError) {
      setExportModal((current) => ({
        ...current,
        isLoadingHistory: false,
        error: statusError instanceof Error ? statusError.message : 'Nao foi possivel carregar o estado dos lancamentos.',
      }));
    }
  }

  function openExportModal() {
    setExportModal({
      isOpen: true,
      isSubmitting: false,
      isLoadingHistory: false,
      error: null,
      success: null,
      result: null,
      status: null,
    });
  }

  function closeExportModal() {
    setExportModal({
      isOpen: false,
      isSubmitting: false,
      isLoadingHistory: false,
      error: null,
      success: null,
      result: null,
      status: null,
    });
  }

  async function handleVehicleRevenueExport() {
    if (!token || !selectedExportWeekId) {
      return;
    }

    setExportModal((current) => ({
      ...current,
      isSubmitting: true,
      error: null,
      success: null,
      result: null,
    }));

    try {
      const response = await apiRequest<VehicleRevenueExportResponse>('/api/v1/conta-azul/manager/export-vehicle-revenues', {
        method: 'POST',
        token,
        body: JSON.stringify({
          tvde_week_id: selectedExportWeekId,
        }),
      });

      setExportModal((current) => ({
        ...current,
        isSubmitting: false,
        success: response.message,
        result: response,
      }));

      await loadVehicleRevenueExportStatus(selectedExportWeekId);
    } catch (submitError) {
      setExportModal((current) => ({
        ...current,
        isSubmitting: false,
        error: submitError instanceof Error ? submitError.message : 'Nao foi possivel lancar os recebimentos.',
      }));
    }
  }

  const activeCompany =
    connectionStatus?.company.name ||
    (view === 'profit-loss' ? profitLoss?.company.name : null) ||
    (view === 'movements' ? movements?.company.name : null) ||
    (view === 'expenses' ? expenses?.company.name : null) ||
    'Area financeira';

  const modalItems: FinancialMovementItem[] =
    profitLossModal === 'receivables'
      ? (profitLoss?.data.raw.receivables ?? [])
      : profitLossModal === 'payables'
        ? (profitLoss?.data.raw.payables ?? [])
        : [];

  const modalTitle = profitLossModal === 'receivables' ? 'Receitas do periodo' : 'Despesas do periodo';
  const modalSummary = profitLossModal === 'receivables'
    ? `${profitLoss?.data.totals.receivables_count ?? 0} movimentos de entrada`
    : `${profitLoss?.data.totals.payables_count ?? 0} movimentos de saida`;
  const modalTotal = profitLossModal === 'receivables'
    ? profitLoss?.data.summary.revenue ?? 0
    : profitLoss?.data.summary.expenses ?? 0;
  const selectedExportWeek = availableWeeks.find((week) => week.id === selectedExportWeekId) ?? null;
  const exportStatus = exportModal.status?.selected_week;

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
              {isAdmin ? (
                <div className="dashboard-actions">
                  <IonButton onClick={openExportModal}>
                    Lancar recebimentos
                  </IonButton>
                </div>
              ) : null}
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
                  <button
                    type="button"
                    className="dashboard-card dashboard-metric-card dashboard-metric-action"
                    onClick={() => setProfitLossModal('receivables')}
                  >
                    <p className="metric-label">Receitas</p>
                    <strong>{formatMoney(profitLoss.data.summary.revenue)}</strong>
                    <span>{profitLoss.data.totals.receivables_count} movimentos de entrada</span>
                    <span className="metric-link">Ver movimentos</span>
                  </button>
                  <button
                    type="button"
                    className="dashboard-card dashboard-metric-card dashboard-metric-action"
                    onClick={() => setProfitLossModal('payables')}
                  >
                    <p className="metric-label">Despesas</p>
                    <strong>{formatMoney(profitLoss.data.summary.expenses)}</strong>
                    <span>{profitLoss.data.totals.payables_count} movimentos de saida</span>
                    <span className="metric-link">Ver movimentos</span>
                  </button>
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
                  <HorizontalMetricChart
                    title="Receitas vs despesas"
                    emptyText="Sem valores para comparar."
                    items={[
                      {
                        label: 'Receitas',
                        value: profitLoss.data.summary.revenue,
                        formattedValue: formatMoney(profitLoss.data.summary.revenue),
                        helper: `${profitLoss.data.totals.receivables_count} movimentos`,
                        tone: 'positive',
                      },
                      {
                        label: 'Despesas',
                        value: profitLoss.data.summary.expenses,
                        formattedValue: formatMoney(profitLoss.data.summary.expenses),
                        helper: `${profitLoss.data.totals.payables_count} movimentos`,
                        tone: 'warm',
                      },
                    ]}
                  />
                  <HorizontalMetricChart
                    title="Receitas por categoria"
                    emptyText="Sem receitas disponiveis."
                    items={profitLoss.data.revenue_categories.slice(0, 6).map((item) => ({
                      label: item.category,
                      value: item.amount,
                      formattedValue: formatMoney(item.amount),
                      helper: `${item.count} movimentos`,
                      tone: 'positive',
                    }))}
                  />
                  <HorizontalMetricChart
                    title="Despesas por categoria"
                    emptyText="Sem despesas disponiveis."
                    items={profitLoss.data.expense_categories.slice(0, 6).map((item) => ({
                      label: item.category,
                      value: item.amount,
                      formattedValue: formatMoney(item.amount),
                      helper: `${item.count} movimentos`,
                      tone: 'warm',
                    }))}
                  />
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
                  <HorizontalMetricChart
                    title="Fluxo financeiro"
                    emptyText="Sem movimentos disponiveis."
                    items={[
                      {
                        label: 'Entradas',
                        value: movements.data.summary.incoming_total,
                        formattedValue: formatMoney(movements.data.summary.incoming_total),
                        helper: 'Recebimentos do periodo',
                        tone: 'positive',
                      },
                      {
                        label: 'Saidas',
                        value: movements.data.summary.outgoing_total,
                        formattedValue: formatMoney(movements.data.summary.outgoing_total),
                        helper: 'Pagamentos do periodo',
                        tone: 'warm',
                      },
                    ]}
                  />
                  <HorizontalMetricChart
                    title="Saldos por conta"
                    emptyText="Sem contas financeiras disponiveis."
                    items={movements.data.accounts.items.slice(0, 6).map((account) => ({
                      label: account.name,
                      value: account.balance,
                      formattedValue: formatMoney(account.balance),
                      helper: account.type || 'Conta',
                      tone: 'neutral',
                    }))}
                  />
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
                  <HorizontalMetricChart
                    title="Estado das despesas"
                    emptyText="Sem despesas disponiveis."
                    items={[
                      {
                        label: 'Pagas',
                        value: expenses.data.summary.paid_expenses,
                        formattedValue: formatMoney(expenses.data.summary.paid_expenses),
                        helper: 'Liquidadas no periodo',
                        tone: 'positive',
                      },
                      {
                        label: 'Em aberto',
                        value: expenses.data.summary.open_expenses,
                        formattedValue: formatMoney(expenses.data.summary.open_expenses),
                        helper: 'Por liquidar',
                        tone: 'neutral',
                      },
                      {
                        label: 'Vencidas',
                        value: expenses.data.summary.overdue_expenses,
                        formattedValue: formatMoney(expenses.data.summary.overdue_expenses),
                        helper: 'Fora de prazo',
                        tone: 'warm',
                      },
                    ]}
                  />
                  <HorizontalMetricChart
                    title="Despesa por categoria"
                    emptyText="Sem categorias de despesa disponiveis."
                    items={expenses.data.categories.expense_breakdown.slice(0, 6).map((item) => ({
                      label: item.category,
                      value: item.amount,
                      formattedValue: formatMoney(item.amount),
                      helper: `${item.count} movimentos`,
                      tone: 'warm',
                    }))}
                  />
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

        <IonModal
          isOpen={profitLossModal !== null}
          onDidDismiss={() => setProfitLossModal(null)}
          initialBreakpoint={0.95}
          breakpoints={[0, 0.95]}
        >
          <div className="finance-modal-shell">
            <div className="finance-modal-header">
              <div>
                <p className="hero-eyebrow">Detalhe</p>
                <h2>{modalTitle}</h2>
                <p className="finance-modal-copy">{modalSummary}</p>
              </div>
              <IonButton fill="clear" onClick={() => setProfitLossModal(null)}>
                Fechar
              </IonButton>
            </div>

            <div className="dashboard-metric-grid finance-modal-summary-grid">
              <article className="dashboard-card dashboard-metric-card">
                <p className="metric-label">Total</p>
                <strong>{formatMoney(modalTotal)}</strong>
                <span>Periodo financeiro ativo</span>
              </article>
              <article className="dashboard-card dashboard-metric-card">
                <p className="metric-label">Movimentos</p>
                <strong>{modalItems.length}</strong>
                <span>Itens devolvidos pela ligacao financeira</span>
              </article>
            </div>

            <div className="receipt-list finance-modal-list">
              {modalItems.length ? modalItems.map((item) => (
                <article key={`${profitLossModal}-${item.id}-${item.date}-${item.description}`} className="receipt-item receipt-item-stacked">
                  <div className="receipt-item-main">
                    <strong>{item.description}</strong>
                    <span>{item.counterparty || item.category || 'Sem detalhe adicional'}</span>
                    <span>{item.date || 'Sem data'}</span>
                  </div>
                  <div className="receipt-meta-col">
                    {item.status ? <span className="status-pill">{item.status}</span> : null}
                    <span className={`status-badge ${profitLossModal === 'receivables' ? 'status-available' : 'status-planned'}`}>
                      {formatMoney(item.amount)}
                    </span>
                  </div>
                </article>
              )) : <p className="dashboard-empty">Sem movimentos disponiveis para este periodo.</p>}
            </div>
          </div>
        </IonModal>

        <IonModal
          isOpen={exportModal.isOpen}
          onDidDismiss={closeExportModal}
          initialBreakpoint={0.82}
          breakpoints={[0, 0.82, 1]}
        >
          <div className="finance-modal-shell">
            <div className="finance-modal-header">
              <div>
                <p className="hero-eyebrow">Conta Azul</p>
                <h2>Lancar recebimentos</h2>
                <p className="finance-modal-copy">
                  Exporta os valores positivos da rentabilidade por matricula para a Conta Azul como recebimentos.
                </p>
              </div>
              <IonButton fill="clear" onClick={closeExportModal}>
                Fechar
              </IonButton>
            </div>

            <article className="dashboard-card finance-export-card">
              <div className="card-head">
                <h3>Semana a exportar</h3>
              </div>
              <p className="finance-modal-copy">Escolhe a semana que queres lancar no sistema financeiro.</p>

              <IonItem lines="none" className="driver-week-picker finance-export-picker">
                <IonLabel>Semana</IonLabel>
                <IonSelect
                  interface="action-sheet"
                  value={selectedExportWeekId ?? undefined}
                  onIonChange={(event) => setSelectedExportWeekId(Number(event.detail.value))}
                  disabled={isLoadingWeeks || availableWeeks.length === 0}
                >
                  {availableWeeks.map((week) => (
                    <IonSelectOption key={week.id} value={week.id}>
                      {week.label}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              {selectedExportWeek ? (
                <div className="submission-meta finance-export-meta">
                  <span>Semana {selectedExportWeek.number ?? '-'}</span>
                  <span>{selectedExportWeek.start_date} a {selectedExportWeek.end_date}</span>
                </div>
              ) : null}

              <div className="dashboard-actions">
                <IonButton
                  onClick={() => void handleVehicleRevenueExport()}
                  disabled={isLoadingWeeks || exportModal.isSubmitting || !selectedExportWeekId}
                >
                  {exportModal.isSubmitting ? 'A lancar...' : 'Lancar na Conta Azul'}
                </IonButton>
              </div>
            </article>

            {exportModal.error ? <p className="status-error">{exportModal.error}</p> : null}
            {exportModal.success ? <p className="status-success">{exportModal.success}</p> : null}

            {exportModal.isLoadingHistory ? (
              <div className="loading-state">
                <IonSpinner name="crescent" />
              </div>
            ) : null}

            {exportStatus ? (
              <>
                <div className="dashboard-metric-grid finance-modal-summary-grid">
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Ja exportadas</p>
                    <strong>{exportStatus.summary.exported}</strong>
                    <span>{exportStatus.summary.total} viaturas com registo nesta semana</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Com erro</p>
                    <strong>{exportStatus.summary.errors}</strong>
                    <span>Itens que exigem nova tentativa ou validacao</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Montante</p>
                    <strong>{formatMoney(exportStatus.summary.amount)}</strong>
                    <span>{exportStatus.summary.last_exported_at ? `Ultimo envio ${exportStatus.summary.last_exported_at}` : 'Sem data de envio'}</span>
                  </article>
                </div>

                <article className="dashboard-card finance-export-history-card">
                  <div className="card-head">
                    <h3>Estado da semana</h3>
                  </div>
                  <div className="receipt-list">
                    {exportStatus.items.length ? exportStatus.items.map((item) => (
                      <article key={`history-${item.id}`} className="receipt-item receipt-item-stacked">
                        <div className="receipt-item-main">
                          <strong>{item.license_plate}</strong>
                          <span>{item.description || 'Receita por matricula exportada para o Conta Azul.'}</span>
                          <span>{item.exported_at || 'Sem data de envio'}</span>
                          {item.error_message ? <span>{item.error_message}</span> : null}
                        </div>
                        <div className="receipt-meta-col">
                          <span className={`status-badge ${item.status === 'exported' ? 'status-available' : 'status-planned'}`}>
                            {item.status === 'exported' ? 'Exportada' : 'Falhou'}
                          </span>
                          <span className="status-pill">{formatMoney(item.amount)}</span>
                        </div>
                      </article>
                    )) : <p className="dashboard-empty">Ainda nao existem lancamentos registados para esta semana.</p>}
                  </div>
                </article>
              </>
            ) : null}

            {exportModal.result ? (
              <>
                <div className="dashboard-metric-grid finance-modal-summary-grid">
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Exportadas</p>
                    <strong>{exportModal.result.data.exported}</strong>
                    <span>Viaturas lancadas com sucesso</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Ignoradas</p>
                    <strong>{exportModal.result.data.skipped}</strong>
                    <span>Ja exportadas anteriormente</span>
                  </article>
                </div>

                <div className="receipt-list finance-modal-list">
                  {exportModal.result.data.items.length ? exportModal.result.data.items.map((item) => (
                    <article key={`${item.vehicle_item_id}-${item.status}`} className="receipt-item">
                      <div>
                        <strong>{item.license_plate}</strong>
                        <span>{item.message || 'Recebimento preparado para a semana selecionada.'}</span>
                      </div>
                      <span className={`status-badge ${
                        item.status === 'exported'
                          ? 'status-available'
                          : item.status === 'skipped'
                            ? 'status-locked'
                            : 'status-planned'
                      }`}
                      >
                        {item.status === 'exported'
                          ? item.amount ? formatMoney(item.amount) : 'Exportada'
                          : item.status === 'skipped'
                            ? 'Ignorada'
                            : 'Falhou'}
                      </span>
                    </article>
                  )) : <p className="dashboard-empty">Sem viaturas positivas para exportar nesta semana.</p>}
                </div>
              </>
            ) : null}

            {exportModal.status?.recent_weeks.length ? (
              <article className="dashboard-card finance-export-history-card">
                <div className="card-head">
                  <h3>Historico recente</h3>
                </div>
                <div className="receipt-list">
                  {exportModal.status.recent_weeks.map((item) => (
                    <div key={`recent-${item.week.id}`} className="receipt-item">
                      <div>
                        <strong>Semana {item.week.number ?? item.week.id}</strong>
                        <span>
                          {item.week.start_date && item.week.end_date
                            ? `${item.week.start_date} a ${item.week.end_date}`
                            : 'Periodo nao identificado'}
                        </span>
                      </div>
                      <div className="receipt-meta-col">
                        <span className="status-pill">{item.summary.exported}/{item.summary.total} exportadas</span>
                        <span className={`status-badge ${item.summary.errors > 0 ? 'status-planned' : 'status-available'}`}>
                          {item.summary.errors > 0 ? `${item.summary.errors} com erro` : 'Sem erros'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default ManagerFinancePage;
