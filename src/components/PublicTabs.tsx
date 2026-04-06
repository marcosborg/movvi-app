import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react';
import { Redirect, Route } from 'react-router-dom';
import { carSportOutline, homeOutline, logInOutline, newspaperOutline } from 'ionicons/icons';
import PublicHome from '../pages/PublicHome';
import ServicesPage from '../pages/ServicesPage';
import StoriesPage from '../pages/StoriesPage';
import AccountPage from '../pages/AccountPage';

const PublicTabs: React.FC = () => (
  <IonTabs>
    <IonRouterOutlet id="tabs-content">
      <Route exact path="/tabs/home">
        <PublicHome />
      </Route>
      <Route exact path="/tabs/services">
        <ServicesPage />
      </Route>
      <Route exact path="/tabs/stories">
        <StoriesPage />
      </Route>
      <Route exact path="/tabs/account">
        <AccountPage />
      </Route>
      <Route exact path="/tabs">
        <Redirect to="/tabs/home" />
      </Route>
    </IonRouterOutlet>

    <IonTabBar slot="bottom" className="public-tabbar">
      <IonTabButton tab="home" href="/tabs/home">
        <IonIcon icon={homeOutline} />
        <IonLabel>Home</IonLabel>
      </IonTabButton>
      <IonTabButton tab="services" href="/tabs/services">
        <IonIcon icon={carSportOutline} />
        <IonLabel>Servicos</IonLabel>
      </IonTabButton>
      <IonTabButton tab="stories" href="/tabs/stories">
        <IonIcon icon={newspaperOutline} />
        <IonLabel>Noticias</IonLabel>
      </IonTabButton>
      <IonTabButton tab="account" href="/tabs/account">
        <IonIcon icon={logInOutline} />
        <IonLabel>Entrar</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
);

export default PublicTabs;
