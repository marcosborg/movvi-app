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
import DriverWeekPicker from '../components/DriverWeekPicker';
import { useDriverWeek } from '../components/DriverWeekContext';
import DriverPageHeader from '../components/DriverPageHeader';
import { apiRequest } from '../lib/api';
import { DriverDashboardResponse, formatKm, formatMoney, getAccountValue } from './driverArea';
import './Home.css';

const DriverStatementPage: React.FC = () => {
  const { token } = useAuth();
  const { selectedWeek } = useDriverWeek();
  const [dashboard, setDashboard] = useState<DriverDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadStatement();
  }, [token, selectedWeek]);

  async function loadStatement() {
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
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar o extrato.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    await loadStatement();
    event.detail.complete();
  }

  const accountSummary = dashboard?.driver_hub.account_summary;
  const driverHub = dashboard?.driver_hub;
  const totalGross = getAccountValue(accountSummary, 'total_gross');
  const totalNet = getAccountValue(accountSummary, 'total_net');
  const adjustments = getAccountValue(accountSummary, 'adjustments');
  const generalAdjustments = getAccountValue(accountSummary, 'general_adjustments', adjustments);
  const rentDiscount = getAccountValue(accountSummary, 'abatimento_aluguer');
  const minimumBillingDifference = getAccountValue(accountSummary, 'diferenca_faturacao_minima');
  const cautionReceived = getAccountValue(accountSummary, 'caucao_recebida');
  const cautionReturned = getAccountValue(accountSummary, 'caucao_devolvida');
  const carHire = getAccountValue(accountSummary, 'car_hire');
  const carHireBase = getAccountValue(accountSummary, 'car_hire_base', carHire);
  const carTrack = getAccountValue(accountSummary, 'car_track');
  const fuelTransactions = getAccountValue(accountSummary, 'fuel_transactions');
  const vatValue = getAccountValue(accountSummary, 'vat_value');
  const weeklyKm = driverHub?.statement_metrics?.weekly_km ?? getAccountValue(accountSummary, 'weekly_km');
  const earningsPerKm = driverHub?.statement_metrics?.earnings_per_km ?? getAccountValue(accountSummary, 'earnings_per_km');

  return (
    <IonPage>
      <DriverPageHeader title="Extrato" />
      <IonContent fullscreen className="home-page">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="home-shell home-shell-with-tabs">
          <DriverWeekPicker />
          {isLoading ? (
            <div className="loading-state">
              <IonSpinner name="crescent" />
            </div>
          ) : null}

          {error ? <p className="status-error">{error}</p> : null}

          {!isLoading && !error && driverHub ? (
            <>
              <section className="dashboard-section">
                <div className="dashboard-section-heading">
                  <div>
                    <p className="hero-eyebrow">Extrato semanal</p>
                    <h2>{driverHub.week.start_date} a {driverHub.week.end_date}</h2>
                  </div>
                </div>
                <div className="dashboard-card-grid">
                  <article className="dashboard-card">
                    <div className="card-head">
                      <h3>Atividades por operador</h3>
                    </div>
                    <p>Uber bruto: {formatMoney(getAccountValue(accountSummary, 'uber.uber_gross', getAccountValue(accountSummary, 'uber_gross')))}</p>
                    <p>Uber liquido: {formatMoney(getAccountValue(accountSummary, 'uber.uber_net', getAccountValue(accountSummary, 'uber_net')))}</p>
                    <p>Bolt bruto: {formatMoney(getAccountValue(accountSummary, 'bolt.bolt_gross', getAccountValue(accountSummary, 'bolt_gross')))}</p>
                    <p>Bolt liquido: {formatMoney(getAccountValue(accountSummary, 'bolt.bolt_net', getAccountValue(accountSummary, 'bolt_net')))}</p>
                  </article>

                  <article className="dashboard-card">
                    <div className="card-head">
                      <h3>Totais do extrato</h3>
                    </div>
                    <p>Ganhos brutos: {formatMoney(totalGross)}</p>
                    <p>Ganhos liquidos: {formatMoney(totalNet)}</p>
                    <p>Total da semana: {formatMoney(driverHub.statement_metrics?.total)}</p>
                    <p>KM da semana: {formatKm(weeklyKm)}</p>
                    <p>Valor por km: {formatMoney(earningsPerKm)}/km</p>
                    <p>Taxa: {formatMoney(vatValue)}</p>
                  </article>
                </div>
              </section>

              <section className="dashboard-section">
                <div className="dashboard-section-heading">
                  <div>
                    <p className="hero-eyebrow">Debitos e creditos</p>
                    <h2>Leitura financeira</h2>
                  </div>
                </div>
                <div className="dashboard-card-grid">
                  <article className="dashboard-card">
                    <div className="card-head">
                      <h3>Debitos</h3>
                    </div>
                    <p>Aluguer: {formatMoney(carHire)}</p>
                    {rentDiscount > 0 ? <p>Abatimento de aluguer: {formatMoney(rentDiscount)}</p> : null}
                    {carHireBase > 0 && rentDiscount > 0 ? <p>Aluguer base: {formatMoney(carHireBase)}</p> : null}
                    <p>Via Verde: {formatMoney(carTrack)}</p>
                    <p>Abastecimentos: {formatMoney(fuelTransactions)}</p>
                    <p>Taxa: {formatMoney(vatValue)}</p>
                  </article>

                  <article className="dashboard-card">
                    <div className="card-head">
                      <h3>Acertos e saldo</h3>
                    </div>
                    <p>Acertos: {formatMoney(adjustments)}</p>
                    <p>Ajustes gerais: {formatMoney(generalAdjustments)}</p>
                    {minimumBillingDifference !== 0 ? (
                      <p>Diferenca de faturacao minima: {formatMoney(minimumBillingDifference)}</p>
                    ) : null}
                    <p>Saldo transitado: {formatMoney(driverHub.balance?.last_balance)}</p>
                    <p>Novo saldo: {formatMoney(driverHub.balance?.new_balance)}</p>
                    <p>Saldo final: {formatMoney(driverHub.balance?.final)}</p>
                  </article>

                  <article className="dashboard-card">
                    <div className="card-head">
                      <h3>Movimentos informativos</h3>
                    </div>
                    <p>Caucao recebida: {formatMoney(cautionReceived)}</p>
                    <p>Caucao devolvida: {formatMoney(cautionReturned)}</p>
                    <p>Gorjetas: {formatMoney(getAccountValue(accountSummary, 'tips_total'))}</p>
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

export default DriverStatementPage;
