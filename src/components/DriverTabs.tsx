import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react';
import { Redirect, Route } from 'react-router-dom';
import {
  analyticsOutline,
  documentTextOutline,
  documentsOutline,
  gridOutline,
} from 'ionicons/icons';
import { DriverWeekProvider } from './DriverWeekContext';
import DriverDocumentsPage from '../pages/DriverDocumentsPage';
import DriverOverviewPage from '../pages/DriverOverviewPage';
import DriverReceiptsPage from '../pages/DriverReceiptsPage';
import DriverStatementPage from '../pages/DriverStatementPage';

const DriverTabs: React.FC = () => (
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
        <Route exact path="/dashboard/documents">
          <DriverDocumentsPage />
        </Route>
        <Route exact path="/dashboard">
          <Redirect to="/dashboard/overview" />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom" className="driver-tabbar">
        <IonTabButton tab="overview" href="/dashboard/overview">
          <IonIcon icon={gridOutline} />
          <IonLabel>Resumo</IonLabel>
        </IonTabButton>
        <IonTabButton tab="statement" href="/dashboard/statement">
          <IonIcon icon={analyticsOutline} />
          <IonLabel>Extrato</IonLabel>
        </IonTabButton>
        <IonTabButton tab="receipts" href="/dashboard/receipts">
          <IonIcon icon={documentTextOutline} />
          <IonLabel>Recibos</IonLabel>
        </IonTabButton>
        <IonTabButton tab="documents" href="/dashboard/documents">
          <IonIcon icon={documentsOutline} />
          <IonLabel>Documentos</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  </DriverWeekProvider>
);

export default DriverTabs;
