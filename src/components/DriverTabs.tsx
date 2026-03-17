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
  carSportOutline,
  documentTextOutline,
  documentsOutline,
  gridOutline,
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

const DriverTabs: React.FC = () => {
  const { user, driver } = useAuth();
  const isAdmin = Boolean(user?.roles.includes('Admin'));
  const hasDriverProfile = Boolean(driver);
  const adminOnlyMode = isAdmin && !hasDriverProfile;

  return (
    <DriverWeekProvider>
      <IonTabs>
      <IonRouterOutlet id="driver-tabs-content">
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
          <Redirect to={adminOnlyMode ? "/dashboard/inspections" : "/dashboard/overview"} />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom" className="driver-tabbar">
        {!adminOnlyMode ? (
          <IonTabButton tab="overview" href="/dashboard/overview">
            <IonIcon icon={gridOutline} />
            <IonLabel>Resumo</IonLabel>
          </IonTabButton>
        ) : null}
        {!adminOnlyMode ? (
          <IonTabButton tab="statement" href="/dashboard/statement">
            <IonIcon icon={analyticsOutline} />
            <IonLabel>Extrato</IonLabel>
          </IonTabButton>
        ) : null}
        {!adminOnlyMode ? (
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
        {!adminOnlyMode ? (
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
