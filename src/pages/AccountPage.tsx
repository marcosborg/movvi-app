import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonPage,
} from '@ionic/react';
import PublicPageHeader from '../components/PublicPageHeader';
import { useAuth } from '../auth/AuthContext';
import { brandAssets } from '../lib/publicContent';
import './PublicPages.css';

const AccountPage: React.FC = () => {
  const { isAuthenticated, user, driver, logout } = useAuth();

  return (
    <IonPage>
      <PublicPageHeader title="Conta" />
      <IonContent fullscreen className="public-page">
        <div className="public-shell">
          <section className="public-section surface-panel reserved-panel">
            <div className="reserved-brand">
              <img src={brandAssets.logo} alt="Movvi" />
            </div>
            <p className="section-tag">Area reservada</p>
            <h1 className="page-title">{isAuthenticated ? 'Acesso pronto' : 'Acesso reservado'}</h1>
            <p>
              {isAuthenticated
                ? 'A sua sessao esta ativa. Pode entrar diretamente no dashboard.'
                : 'Se precisar de acesso, contacte um administrador do sistema para obter credenciais.'}
            </p>
            <div className="account-actions">
              <IonButton routerLink={isAuthenticated ? '/dashboard' : '/login'}>
                {isAuthenticated ? 'Abrir dashboard' : 'Iniciar sessao'}
              </IonButton>
              {isAuthenticated ? (
                <IonButton fill="outline" onClick={logout}>
                  Terminar sessao
                </IonButton>
              ) : null}
              {!isAuthenticated ? (
                <IonButton fill="outline" routerLink="/tabs/home">
                  Continuar na area publica
                </IonButton>
              ) : null}
            </div>
          </section>

          {isAuthenticated ? (
            <IonCard className="surface-panel account-summary">
              <IonCardContent>
                <p className="section-tag">Sessao atual</p>
                <h2>{user?.name}</h2>
                <p>{user?.email}</p>
                <p>Motorista: {driver?.name || 'Nao associado'}</p>
                <p>Empresa: {driver?.company?.name || 'Nao associada'}</p>
              </IonCardContent>
            </IonCard>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AccountPage;
