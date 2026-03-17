import { FormEvent, useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonIcon,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonText,
} from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { brandAssets } from '../lib/publicContent';
import './Login.css';

const Login: React.FC = () => {
  const history = useHistory();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      history.replace('/dashboard');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Nao foi possivel iniciar sessao.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <IonPage>
      <IonContent fullscreen className="login-page">
        <div className="login-shell">
          <div className="login-topbar">
            <IonButton className="login-back" fill="clear" onClick={() => history.goBack()}>
              <IonIcon slot="start" icon={chevronBackOutline} />
              Voltar
            </IonButton>
          </div>

          <IonCard className="login-card">
            <IonCardHeader>
              <div className="login-brand">
                <img src={brandAssets.logo} alt="Movvi" />
              </div>
              <IonCardSubtitle>Area reservada</IonCardSubtitle>
              <IonCardTitle>Entrar</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <form onSubmit={handleSubmit} className="login-form">
                <IonItem>
                  <IonLabel position="stacked">Email</IonLabel>
                  <IonInput
                    type="email"
                    value={email}
                    onIonInput={(event) => setEmail(event.detail.value ?? '')}
                    autocomplete="email"
                    required
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Password</IonLabel>
                  <IonInput
                    type="password"
                    value={password}
                    onIonInput={(event) => setPassword(event.detail.value ?? '')}
                    autocomplete="current-password"
                    required
                  />
                </IonItem>

                {error ? (
                  <IonText color="danger">
                    <p className="login-error">{error}</p>
                  </IonText>
                ) : null}

                <IonButton type="submit" expand="block" disabled={isSubmitting}>
                  {isSubmitting ? 'A entrar...' : 'Iniciar sessao'}
                </IonButton>
              </form>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
