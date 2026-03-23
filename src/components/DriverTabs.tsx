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
  clipboardOutline,
  documentTextOutline,
  documentsOutline,
  gridOutline,
  swapHorizontalOutline,
} from 'ionicons/icons';
import { FinancePeriodProvider } from './FinancePeriodContext';
import { DriverWeekProvider } from './DriverWeekContext';
import AdminTransferPage from '../pages/AdminTransferPage';
import DriverDocumentsPage from '../pages/DriverDocumentsPage';
import DriverInspectionDetailPage from '../pages/DriverInspectionDetailPage';
import DriverInspectionsPage from '../pages/DriverInspectionsPage';
import DriverOverviewPage from '../pages/DriverOverviewPage';
import DriverReceiptsPage from '../pages/DriverReceiptsPage';
import DriverStatementPage from '../pages/DriverStatementPage';
import DriverWeeklyEvaluationPage from '../pages/DriverWeeklyEvaluationPage';
import ManagerCompanyReportsPage from '../pages/ManagerCompanyReportsPage';
import ManagerFinancePage from '../pages/ManagerFinancePage';

const DriverTabs: React.FC = () => {
  const { user, driver } = useAuth();
  const isAdmin = Boolean(user?.roles.includes('Admin'));
  const isGestor = Boolean(user?.roles.includes('Gestor'));
  const canViewFinance = isAdmin || isGestor;
  const hasDriverProfile = Boolean(driver);
  const adminOperationsOnlyMode = isAdmin && !hasDriverProfile;

  return (
    <DriverWeekProvider>
      <FinancePeriodProvider>
      <IonTabs>
      <IonRouterOutlet id="driver-tabs-content">
        <Route exact path="/dashboard/finance">
          <ManagerFinancePage />
        </Route>
        <Route exact path="/dashboard/finance/profit-loss">
          <Redirect to="/dashboard/finance" />
        </Route>
        <Route exact path="/dashboard/finance/movements">
          <Redirect to="/dashboard/finance" />
        </Route>
        <Route exact path="/dashboard/finance/expenses">
          <Redirect to="/dashboard/finance" />
        </Route>
        <Route exact path="/dashboard/company-reports">
          <ManagerCompanyReportsPage />
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
        <Route exact path="/dashboard/weekly-evaluation">
          <DriverWeeklyEvaluationPage />
        </Route>
        <Route exact path="/dashboard">
          <Redirect to={
             hasDriverProfile
              ? '/dashboard/overview'
              : canViewFinance
                ? '/dashboard/finance'
                : adminOperationsOnlyMode
                  ? '/dashboard/inspections'
                  : '/dashboard/overview'
          } />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom" className="driver-tabbar">
        {canViewFinance ? (
          <IonTabButton tab="finance" href="/dashboard/finance">
            <IonIcon icon={barChartOutline} />
            <IonLabel>Financeiro</IonLabel>
          </IonTabButton>
        ) : null}
        {canViewFinance ? (
          <IonTabButton tab="company-reports" href="/dashboard/company-reports">
            <IonIcon icon={clipboardOutline} />
            <IonLabel>Relatorios</IonLabel>
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
          <IonTabButton tab="weekly-evaluation" href="/dashboard/weekly-evaluation">
            <IonIcon icon={clipboardOutline} />
            <IonLabel>Semanal</IonLabel>
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
      </FinancePeriodProvider>
    </DriverWeekProvider>
  );
};

export default DriverTabs;
