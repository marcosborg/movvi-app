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
import { carSportOutline, logInOutline, logoWhatsapp, newspaperOutline, sparklesOutline } from 'ionicons/icons';
import { useLocation } from 'react-router-dom';
import { brandAssets, supportContacts } from '../lib/publicContent';

const menuItems = [
  { title: 'Home', url: '/tabs/home', icon: sparklesOutline },
  { title: 'Servicos', url: '/tabs/services', icon: carSportOutline },
  { title: 'Noticias', url: '/tabs/stories', icon: newspaperOutline },
  { title: 'Entrar na conta', url: '/tabs/account', icon: logInOutline },
];

const PublicMenu: React.FC = () => {
  const location = useLocation();

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

        <div className="menu-intro">
          <p>Explore a area publica com a mesma leitura da home e entre na conta apenas quando precisar de aceder a dados reservados.</p>
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
                <IonLabel>{item.title}</IonLabel>
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
