import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react';
import { useAuth } from '../auth/AuthContext';
import { Redirect, Route } from 'react-router-dom';
import {
  analyticsOutline,
  barChartOutline,
  carSportOutline,
  documentTextOutline,
  documentsOutline,
  gridOutline,
  walletOutline,
  swapHorizontalOutline,
} from 'ionicons/icons';
import { DriverWeekProvider } from './DriverWeekContext';
import AdminTransferPage from '../pages/AdminTransferPage';
import DriverDocumentsPage from '../pages/DriverDocumentsPage';
import DriverInspectionDetailPage from '../pages/DriverInspectionDetailPage';
import DriverInspectionsPage from '../pages/DriverInspectionsPage';
import DriverOverviewPage from '../pages/DriverOverviewPage';
import DriverReceiptsPage from '../pages/DriverReceiptsPage';
import DriverStatementPage from '../pages/DriverStatementPage';
import ManagerExpensesPage from '../pages/ManagerExpensesPage';
import ManagerMovementsPage from '../pages/ManagerMovementsPage';
import ManagerProfitLossPage from '../pages/ManagerProfitLossPage';

const DriverTabs: React.FC = () => {
  const { user, driver } = useAuth();
  const isAdmin = Boolean(user?.roles.includes('Admin'));
  const isGestor = Boolean(user?.roles.includes('Gestor'));
  const canViewFinance = isAdmin || isGestor;
  const hasDriverProfile = Boolean(driver);
  const adminOperationsOnlyMode = isAdmin && !hasDriverProfile;

  return (
    <DriverWeekProvider>
      <IonTabs>
      <IonRouterOutlet id="driver-tabs-content">
        <Route exact path="/dashboard/finance/profit-loss">
          <ManagerProfitLossPage />
        </Route>
        <Route exact path="/dashboard/finance/movements">
          <ManagerMovementsPage />
        </Route>
        <Route exact path="/dashboard/finance/expenses">
          <ManagerExpensesPage />
        </Route>
        <Route exact path="/dashboard/overview">
          <DriverOverviewPage />
        </Route>
        <Route exact path="/dashboard/statement">
          <DriverStatementPage />
        </Route>
        <Route exact path="/dashboard/receipts">
          <DriverReceiptsPage />
        </Route>
        <Route exact path="/dashboard/inspections/:id">
          <DriverInspectionDetailPage />
        </Route>
        <Route exact path="/dashboard/inspections">
          <DriverInspectionsPage />
        </Route>
        <Route exact path="/dashboard/transfers">
          <AdminTransferPage />
        </Route>
        <Route exact path="/dashboard/documents">
          <DriverDocumentsPage />
        </Route>
        <Route exact path="/dashboard">
          <Redirect to={
            hasDriverProfile
              ? '/dashboard/overview'
              : canViewFinance
                ? '/dashboard/finance/profit-loss'
                : adminOperationsOnlyMode
                  ? '/dashboard/inspections'
                  : '/dashboard/overview'
          } />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom" className="driver-tabbar">
        {canViewFinance ? (
          <IonTabButton tab="profit-loss" href="/dashboard/finance/profit-loss">
            <IonIcon icon={barChartOutline} />
            <IonLabel>DRE</IonLabel>
          </IonTabButton>
        ) : null}
        {canViewFinance ? (
          <IonTabButton tab="movements" href="/dashboard/finance/movements">
            <IonIcon icon={analyticsOutline} />
            <IonLabel>Movimentos</IonLabel>
          </IonTabButton>
        ) : null}
        {canViewFinance ? (
          <IonTabButton tab="expenses" href="/dashboard/finance/expenses">
            <IonIcon icon={walletOutline} />
            <IonLabel>Despesas</IonLabel>
          </IonTabButton>
        ) : null}
        {hasDriverProfile ? (
          <IonTabButton tab="overview" href="/dashboard/overview">
            <IonIcon icon={gridOutline} />
            <IonLabel>Resumo</IonLabel>
          </IonTabButton>
        ) : null}
        {hasDriverProfile ? (
          <IonTabButton tab="statement" href="/dashboard/statement">
            <IonIcon icon={analyticsOutline} />
            <IonLabel>Extrato</IonLabel>
          </IonTabButton>
        ) : null}
        {hasDriverProfile ? (
          <IonTabButton tab="receipts" href="/dashboard/receipts">
            <IonIcon icon={documentTextOutline} />
            <IonLabel>Recibos</IonLabel>
          </IonTabButton>
        ) : null}
        {isAdmin ? (
          <IonTabButton tab="inspections" href="/dashboard/inspections">
            <IonIcon icon={carSportOutline} />
            <IonLabel>Inspecoes</IonLabel>
          </IonTabButton>
        ) : null}
        {isAdmin ? (
          <IonTabButton tab="transfers" href="/dashboard/transfers">
            <IonIcon icon={swapHorizontalOutline} />
            <IonLabel>Passagens</IonLabel>
          </IonTabButton>
        ) : null}
        {hasDriverProfile ? (
          <IonTabButton tab="documents" href="/dashboard/documents">
            <IonIcon icon={documentsOutline} />
            <IonLabel>Documentos</IonLabel>
          </IonTabButton>
        ) : null}
      </IonTabBar>
      </IonTabs>
    </DriverWeekProvider>
  );
};

export default DriverTabs;
