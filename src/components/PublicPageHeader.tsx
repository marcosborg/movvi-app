import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonNote,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { lockClosedOutline, lockOpenOutline } from 'ionicons/icons';
import { useAuth } from '../auth/AuthContext';
import { brandAssets } from '../lib/publicContent';

type PublicPageHeaderProps = {
  title: string;
};

const PublicPageHeader: React.FC<PublicPageHeaderProps> = ({ title }) => {
  const { isAuthenticated } = useAuth();

  return (
    <IonHeader translucent>
      <IonToolbar className="public-toolbar">
        <IonButtons slot="start">
          <IonMenuButton />
        </IonButtons>
        <IonTitle>
          <div className="public-header-brand">
            <IonAvatar className="public-header-logo">
              <img src={brandAssets.logo} alt="Movvi" />
            </IonAvatar>
            <div className="public-header-copy">
              <strong>{title}</strong>
              <IonNote>Mobilidade a sua medida</IonNote>
            </div>
          </div>
        </IonTitle>
        <IonButtons slot="end">
          <IonButton
            className="public-header-action public-header-lock"
            routerLink={isAuthenticated ? '/dashboard' : '/login'}
            aria-label={isAuthenticated ? 'Sessao ativa' : 'Sessao inativa'}
          >
            <IonIcon icon={isAuthenticated ? lockOpenOutline : lockClosedOutline} />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};

export default PublicPageHeader;
