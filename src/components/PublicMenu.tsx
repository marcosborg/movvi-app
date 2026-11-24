import {
  IonAvatar,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonMenuToggle,
  IonNote,
} from '@ionic/react';
import {
  buildOutline,
  carSportOutline,
  flashOutline,
  logInOutline,
  logoWhatsapp,
  newspaperOutline,
  speedometerOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { brandAssets, supportContacts } from '../lib/publicContent';

const menuItems = [
  { title: 'Início', url: '/tabs/home', icon: sparklesOutline },
  { title: 'Servicos', url: '/tabs/services', icon: carSportOutline },
  { title: 'Noticias', url: '/tabs/stories', icon: newspaperOutline },
  { title: 'Entrar na conta', url: '/tabs/account', icon: logInOutline },
];

const driverShortcuts = [
  {
    title: 'Carregamentos e desempenho',
    subtitle: 'Portal externo · início de sessão próprio',
    href: 'https://dashboard.movvi.com.pt/motorista',
    icon: speedometerOutline,
    external: true,
  },
  {
    title: 'Carregar nos postos Movvi',
    href: 'https://charge.movvi.com.pt/',
    icon: flashOutline,
    external: true,
  },
  {
    title: 'Manutenção e viaturas',
    href: '/dashboard/maintenance',
    icon: buildOutline,
    external: false,
  },
];

const PublicMenu: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  return (
    <IonMenu contentId="main-content" type="overlay" className="public-menu">
      <IonContent className="menu-shell">
        <div className="menu-brand">
          <IonAvatar className="menu-avatar">
            <img src={brandAssets.logo} alt="Movvi" />
          </IonAvatar>
          <div className="menu-brand-copy">
            <h2>Movvi</h2>
            <IonNote>Mobilidade a sua medida</IonNote>
          </div>
        </div>


        <IonList inset className="menu-section-list">
          <IonListHeader>Navegacao</IonListHeader>
          {menuItems.map((item) => (
            <IonMenuToggle autoHide={true} key={item.url}>
              <IonItem
                routerLink={item.url}
                detail={false}
                className={`menu-link-item ${location.pathname === item.url ? 'selected' : ''}`}
              >
                <IonIcon slot="start" icon={item.icon} />
                <IonLabel>{isAuthenticated && item.url === '/tabs/account' ? 'A minha conta' : item.title}</IonLabel>
              </IonItem>
            </IonMenuToggle>
          ))}
        </IonList>

        <IonList inset className="menu-section-list">
          <IonListHeader>Área do motorista</IonListHeader>
          {driverShortcuts.map((item) => (
            <IonMenuToggle autoHide={true} key={item.href}>
              <IonItem
                {...(item.external
                  ? { href: item.href, target: '_blank', rel: 'noreferrer' }
                  : { routerLink: item.href })}
                detail={false}
                className="menu-link-item"
              >
                <IonIcon slot="start" icon={item.icon} />
                <IonLabel className="ion-text-wrap">
                  {item.title}
                  {'subtitle' in item && <p>{item.subtitle}</p>}
                </IonLabel>
              </IonItem>
            </IonMenuToggle>
          ))}
        </IonList>

        <IonList inset className="menu-section-list menu-shortcuts">
          <IonListHeader>Apoio ao motorista</IonListHeader>
          {supportContacts.map((contact) => (
            <IonItem
              key={contact.href}
              href={contact.href}
              target="_blank"
              rel="noreferrer"
              detail={false}
              className="menu-link-item"
            >
              <IonIcon slot="start" icon={logoWhatsapp} />
              <IonLabel>
                <h3>{contact.name}</h3>
                <p>{contact.role}</p>
                <p>{contact.phone}</p>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default PublicMenu;
