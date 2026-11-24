import { IonContent, IonItem, IonLabel, IonList, IonPage } from '@ionic/react';
import DriverPageHeader from '../components/DriverPageHeader';
import { supportContacts } from '../lib/publicContent';

type DriverMaintenancePageProps = {
  canManageFleet: boolean;
  hasDriverProfile: boolean;
};

export default function DriverMaintenancePage({ canManageFleet, hasDriverProfile }: DriverMaintenancePageProps) {
  const [fleetSupport] = supportContacts;

  return (
    <IonPage>
      <DriverPageHeader title="Manutenção e viaturas" subtitle="Apoio e operações de frota" />
      <IonContent>
        <IonList>
          {hasDriverProfile && (
            <IonItem routerLink="/dashboard/vehicle-plate">
              <IonLabel className="ion-text-wrap">Ler matrícula</IonLabel>
            </IonItem>
          )}
          {canManageFleet && (
            <>
              <IonItem routerLink="/dashboard/transfers">
                <IonLabel className="ion-text-wrap">Trocas e atribuições de viaturas</IonLabel>
              </IonItem>
              <IonItem routerLink="/dashboard/inspections">
                <IonLabel className="ion-text-wrap">Vistorias</IonLabel>
              </IonItem>
            </>
          )}
          <IonItem href={fleetSupport.href} target="_blank" rel="noopener noreferrer">
            <IonLabel className="ion-text-wrap">Contactar apoio de manutenção</IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  );
}
