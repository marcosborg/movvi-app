import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import type { RefresherEventDetail } from '@ionic/core';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../lib/api';
import './Home.css';

type DashboardResponse = {
  driver: {
    code: string | null;
    name: string | null;
    company: { name: string } | null;
  };
  week: {
    start_date: string;
    end_date: string;
  };
  account_summary: Record<string, unknown> | null;
  balance: {
    final: number;
    value: number;
    last_balance: number;
    new_balance: number;
  } | null;
  vehicle: {
    license_plate: string;
    model: string | null;
  } | null;
};

const Dashboard: React.FC = () => {
  const { token, user, driver, logout } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadDashboard();
  }, [token]);

  async function loadDashboard() {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest<DashboardResponse>('/api/v1/mobile/dashboard', {
        method: 'GET',
        token,
      });

      setDashboard(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar o dashboard.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    await loadDashboard();
    event.detail.complete();
  }

  const accountSummary = dashboard?.account_summary ?? {};

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="home-page">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="home-shell">
          <section className="hero-panel">
            <div>
              <p className="hero-eyebrow">Area reservada</p>
              <h1>{driver?.name || user?.name || 'Conta Movvi'}</h1>
              <p className="hero-copy">
                {driver?.company?.name || 'Sem empresa associada'}
              </p>
            </div>
            <div className="dashboard-actions">
              <IonButton fill="outline" routerLink="/tabs/home">
                Voltar a publico
              </IonButton>
              <IonButton fill="clear" onClick={logout}>
                Terminar sessao
              </IonButton>
            </div>
          </section>

          {isLoading ? (
            <div className="loading-state">
              <IonSpinner name="crescent" />
            </div>
          ) : null}

          {error ? <p className="status-error">{error}</p> : null}

          {!isLoading && !error ? (
            <div className="dashboard-grid">
              <IonCard>
                <IonCardHeader>
                  <IonCardSubtitle>Conta</IonCardSubtitle>
                  <IonCardTitle>{user?.email}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p>Codigo motorista: {dashboard?.driver.code || 'n/a'}</p>
                  <p>Periodo: {dashboard?.week.start_date} a {dashboard?.week.end_date}</p>
                </IonCardContent>
              </IonCard>

              <IonCard>
                <IonCardHeader>
                  <IonCardSubtitle>Saldo</IonCardSubtitle>
                  <IonCardTitle>
                    {dashboard?.balance ? `${dashboard.balance.final.toFixed(2)} EUR` : 'Sem dados'}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p>Valor: {dashboard?.balance?.value ?? 0}</p>
                  <p>Saldo anterior: {dashboard?.balance?.last_balance ?? 0}</p>
                  <p>Novo saldo: {dashboard?.balance?.new_balance ?? 0}</p>
                </IonCardContent>
              </IonCard>

              <IonCard>
                <IonCardHeader>
                  <IonCardSubtitle>Viatura</IonCardSubtitle>
                  <IonCardTitle>{dashboard?.vehicle?.license_plate || 'Nao atribuida'}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p>{dashboard?.vehicle?.model || 'Sem modelo disponivel'}</p>
                </IonCardContent>
              </IonCard>

              <IonCard>
                <IonCardHeader>
                  <IonCardSubtitle>Resumo</IonCardSubtitle>
                  <IonCardTitle>Conta corrente</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p>Uber net: {String(accountSummary.uber_net ?? 0)}</p>
                  <p>Bolt net: {String(accountSummary.bolt_net ?? 0)}</p>
                  <p>Total: {String(accountSummary.total ?? accountSummary.driver_total ?? 0)}</p>
                </IonCardContent>
              </IonCard>
            </div>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
