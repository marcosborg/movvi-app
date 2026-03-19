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
import { chevronBackOutline, eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiRequest } from '../lib/api';
import { brandAssets } from '../lib/publicContent';
import './Login.css';

const Login: React.FC = () => {
  const history = useHistory();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryFeedback, setRecoveryFeedback] = useState<string | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
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

  async function handleRecoveryRequest() {
    setRecoveryError(null);
    setRecoveryFeedback(null);
    setIsRecovering(true);

    try {
      const response = await apiRequest<{ message: string }>('/api/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      setRecoveryFeedback(response.message);
    } catch (recoveryRequestError) {
      setRecoveryError(
        recoveryRequestError instanceof Error
          ? recoveryRequestError.message
          : 'Nao foi possivel pedir a recuperacao da password.',
      );
    } finally {
      setIsRecovering(false);
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
              <IonCardTitle>{showRecovery ? 'Recuperacao' : 'Entrar'}</IonCardTitle>
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

                {!showRecovery ? (
                  <IonItem>
                    <IonLabel position="stacked">Password</IonLabel>
                    <IonInput
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onIonInput={(event) => setPassword(event.detail.value ?? '')}
                      autocomplete="current-password"
                      required
                    />
                    <IonButton
                      type="button"
                      fill="clear"
                      slot="end"
                      className="login-password-toggle"
                      aria-label={showPassword ? 'Esconder password' : 'Mostrar password'}
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
                    </IonButton>
                  </IonItem>
                ) : null}

                {error ? (
                  <IonText color="danger">
                    <p className="login-error">{error}</p>
                  </IonText>
                ) : null}

                <div className="login-recovery">
                  <IonButton
                    type="button"
                    fill="clear"
                    className="login-recovery-trigger"
                    onClick={() => {
                      setShowRecovery((current) => !current);
                      setRecoveryError(null);
                      setRecoveryFeedback(null);
                      setShowPassword(false);
                    }}
                  >
                    {showRecovery ? 'Voltar para login' : 'Esqueceu-se da password?'}
                  </IonButton>

                  {showRecovery ? (
                    <div className="login-recovery-panel">
                      <p>
                        Introduza o email da conta. Se existir, enviamos um link para recuperar a password.
                      </p>
                      <IonButton
                        type="button"
                        fill="outline"
                        className="login-recovery-action"
                        disabled={isRecovering || !email}
                        onClick={handleRecoveryRequest}
                      >
                        {isRecovering ? 'A enviar...' : 'Pedir recuperacao'}
                      </IonButton>

                      {recoveryFeedback ? (
                        <IonText color="success">
                          <p className="login-feedback">{recoveryFeedback}</p>
                        </IonText>
                      ) : null}

                      {recoveryError ? (
                        <IonText color="danger">
                          <p className="login-feedback">{recoveryError}</p>
                        </IonText>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {!showRecovery ? (
                  <IonButton type="submit" expand="block" disabled={isSubmitting}>
                    {isSubmitting ? 'A entrar...' : 'Iniciar sessao'}
                  </IonButton>
                ) : null}
              </form>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
