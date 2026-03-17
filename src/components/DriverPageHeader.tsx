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
import { lockClosedOutline } from 'ionicons/icons';
import { brandAssets } from '../lib/publicContent';

type DriverPageHeaderProps = {
  title: string;
  subtitle?: string;
};

const DriverPageHeader: React.FC<DriverPageHeaderProps> = ({ title, subtitle = 'Area reservada do motorista' }) => (
  <IonHeader translucent>
    <IonToolbar className="public-toolbar driver-toolbar">
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
            <IonNote>{subtitle}</IonNote>
          </div>
        </div>
      </IonTitle>
      <IonButtons slot="end">
        <IonButton className="public-header-action public-header-lock" routerLink="/tabs/account" aria-label="Area reservada">
          <IonIcon icon={lockClosedOutline} />
        </IonButton>
      </IonButtons>
    </IonToolbar>
  </IonHeader>
);

export default DriverPageHeader;
