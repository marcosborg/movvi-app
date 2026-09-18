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
import { FinancePeriodProvider } from './FinancePeriodContext';
import { DriverWeekProvider } from './DriverWeekContext';
import AdminTransferPage from '../pages/AdminTransferPage';
import DriverDocumentsPage from '../pages/DriverDocumentsPage';
import DriverInspectionDetailPage from '../pages/DriverInspectionDetailPage';
import DriverInspectionsPage from '../pages/DriverInspectionsPage';
import DriverGuidePage from '../pages/DriverGuidePage';
import DriverOverviewPage from '../pages/DriverOverviewPage';
import DriverReceiptsPage from '../pages/DriverReceiptsPage';
import DriverStatementPage from '../pages/DriverStatementPage';
import DriverTabPreferencesPage from '../pages/DriverTabPreferencesPage';
import DriverWeeklyEvaluationPage from '../pages/DriverWeeklyEvaluationPage';
import ManagerCompanyReportsPage from '../pages/ManagerCompanyReportsPage';
import ManagerFinancePage from '../pages/ManagerFinancePage';
import { getVisibleDriverTabs, readDriverTabOrder, sortDriverTabsByPreference } from './driverTabPreferences';
import { useEffect, useMemo, useState } from 'react';

const DriverTabs: React.FC = () => {
  const { user, driver } = useAuth();
  const isAdmin = Boolean(user?.roles.includes('Admin'));
  const isGestor = Boolean(user?.roles.includes('Gestor'));
  const canViewFinance = isAdmin;
  const canViewCompanyReports = isAdmin;
  const hasDriverProfile = Boolean(driver);
  const adminOperationsOnlyMode = isAdmin && !hasDriverProfile;
  const [preferredOrder, setPreferredOrder] = useState<string[]>(() => readDriverTabOrder());

  useEffect(() => {
    const syncOrder = () => setPreferredOrder(readDriverTabOrder());
    window.addEventListener('movvi:driver-tab-order-changed', syncOrder);
    return () => window.removeEventListener('movvi:driver-tab-order-changed', syncOrder);
  }, []);

  const visibleTabs = useMemo(() => {
    return sortDriverTabsByPreference(getVisibleDriverTabs({
      isAdmin,
      isGestor,
      canViewFinance,
      canViewCompanyReports,
      hasDriverProfile,
    }), preferredOrder);
  }, [canViewCompanyReports, canViewFinance, hasDriverProfile, isAdmin, isGestor, preferredOrder]);

  return (
    <DriverWeekProvider>
      <FinancePeriodProvider>
      <IonTabs>
      <IonRouterOutlet id="driver-tabs-content">
        <Route exact path="/dashboard/finance">
          {canViewFinance ? <ManagerFinancePage /> : <Redirect to="/dashboard" />}
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
          {canViewCompanyReports ? <ManagerCompanyReportsPage /> : <Redirect to="/dashboard" />}
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
          {isAdmin || isGestor ? <DriverInspectionDetailPage /> : <Redirect to="/dashboard" />}
        </Route>
        <Route exact path="/dashboard/inspections">
          {isAdmin || isGestor ? <DriverInspectionsPage /> : <Redirect to="/dashboard" />}
        </Route>
        <Route exact path="/dashboard/transfers">
          {isAdmin || isGestor ? <AdminTransferPage /> : <Redirect to="/dashboard" />}
        </Route>
        <Route exact path="/dashboard/documents">
          <DriverDocumentsPage />
        </Route>
        <Route exact path="/dashboard/weekly-evaluation">
          <DriverWeeklyEvaluationPage />
        </Route>
        <Route exact path="/dashboard/preferences">
          <DriverTabPreferencesPage />
        </Route>
        <Route exact path="/dashboard/guide">
          <DriverGuidePage />
        </Route>
        <Route exact path="/dashboard">
          <Redirect to={
             isAdmin || isGestor
              ? '/dashboard/transfers'
              : hasDriverProfile
              ? '/dashboard/overview'
              : adminOperationsOnlyMode
                ? '/dashboard/transfers'
                : '/dashboard/overview'
          } />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom" className="driver-tabbar">
        {visibleTabs.map((tab) => (
          <IonTabButton key={tab.key} tab={tab.key} href={tab.href}>
            <IonIcon icon={tab.icon} />
            <IonLabel>{tab.label}</IonLabel>
          </IonTabButton>
        ))}
      </IonTabBar>
      </IonTabs>
      </FinancePeriodProvider>
    </DriverWeekProvider>
  );
};

export default DriverTabs;
