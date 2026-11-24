import {
  IonAvatar,
  IonButtons,
  IonHeader,
  IonMenuButton,
  IonNote,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { brandAssets } from '../lib/publicContent';

type DriverPageHeaderProps = {
  title: string;
  subtitle?: string;
};

const DriverPageHeader: React.FC<DriverPageHeaderProps> = ({ title, subtitle = 'Conta do motorista' }) => (
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
    </IonToolbar>
  </IonHeader>
);

export default DriverPageHeader;
