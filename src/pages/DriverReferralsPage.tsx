import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonInput,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
} from '@ionic/react';
import type { RefresherEventDetail } from '@ionic/core';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import DriverPageHeader from '../components/DriverPageHeader';
import { apiRequest } from '../lib/api';
import './Home.css';

type DriverReferral = {
  id: number;
  name: string;
  phone: string;
  status: 'submitted' | 'joined' | 'eligible' | 'paid' | 'rejected';
  status_label: string;
  reward_amount: number;
  qualified_at: string | null;
  paid_at: string | null;
  created_at: string | null;
};

type ReferralListResponse = {
  reward_amount: number;
  qualification_days: number;
  referrals: DriverReferral[];
};

type ReferralCreateResponse = {
  message: string;
  referral: DriverReferral;
};

const DriverReferralsPage: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<ReferralListResponse | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void loadReferrals();
  }, [token]);

  async function loadReferrals() {
    if (!token) return;

    setIsLoading(true);
    setError(null);
    try {
      setData(await apiRequest<ReferralListResponse>('/api/v1/mobile/driver/referrals', {
        method: 'GET',
        token,
      }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar as indicacoes.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    await loadReferrals();
    event.detail.complete();
  }

  async function handleSubmit() {
    if (!token || isSaving) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiRequest<ReferralCreateResponse>('/api/v1/mobile/driver/referrals', {
        method: 'POST',
        token,
        body: JSON.stringify({ name, phone, consent }),
      });
      setSuccess(response.message);
      setName('');
      setPhone('');
      setConsent(false);
      await loadReferrals();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Nao foi possivel registar a indicacao.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <IonPage>
      <DriverPageHeader title="Indique e Ganhe" subtitle="Recomenda um motorista e acompanha o prémio" />
      <IonContent fullscreen className="home-page">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="home-shell home-shell-with-tabs">
          <section className="hero-panel referral-hero">
            <div className="hero-copy-block">
              <p className="hero-eyebrow">Indique e Ganhe</p>
              <h1>Recebe 50 € por uma boa indicação</h1>
              <p className="hero-copy">
                Indica alguém que queira trabalhar com a Movvi. Quando essa pessoa completar 30 dias como motorista, o teu prémio fica disponível.
              </p>
            </div>
            <div className="referral-reward-badge">
              <strong>{data?.reward_amount ?? 50} €</strong>
              <span>após {data?.qualification_days ?? 30} dias</span>
            </div>
          </section>

          {error ? <p className="status-error">{error}</p> : null}
          {success ? <p className="status-success">{success}</p> : null}

          <section className="dashboard-section">
            <article className="dashboard-card referral-form-card">
              <div className="card-head">
                <div>
                  <h3>Nova indicação</h3>
                  <p>Precisamos apenas do nome e do telefone.</p>
                </div>
              </div>

              <div className="referral-form-grid">
                <label>
                  <span>Nome</span>
                  <IonInput
                    fill="outline"
                    value={name}
                    placeholder="Nome da pessoa"
                    onIonInput={(event) => setName(String(event.detail.value ?? ''))}
                  />
                </label>
                <label>
                  <span>Telefone</span>
                  <IonInput
                    fill="outline"
                    type="tel"
                    inputmode="tel"
                    value={phone}
                    placeholder="Ex.: 912 345 678"
                    onIonInput={(event) => setPhone(String(event.detail.value ?? ''))}
                  />
                </label>
              </div>

              <label className="referral-consent">
                <IonCheckbox
                  checked={consent}
                  onIonChange={(event) => setConsent(event.detail.checked)}
                />
                <span>Confirmo que esta pessoa autorizou a Movvi a contactá-la sobre esta oportunidade.</span>
              </label>

              <IonButton
                expand="block"
                onClick={handleSubmit}
                disabled={isSaving || name.trim().length < 3 || phone.trim().length < 9 || !consent}
              >
                {isSaving ? <IonSpinner name="crescent" /> : 'Enviar indicação'}
              </IonButton>
            </article>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-heading">
              <div>
                <p className="hero-eyebrow">Acompanhamento</p>
                <h2>As minhas indicações</h2>
              </div>
            </div>

            {isLoading ? (
              <div className="loading-state"><IonSpinner name="crescent" /></div>
            ) : data && data.referrals.length > 0 ? (
              <div className="dashboard-card referral-list-card">
                {data.referrals.map((referral) => (
                  <div className="referral-list-item" key={referral.id}>
                    <div>
                      <strong>{referral.name}</strong>
                      <span>{referral.phone}</span>
                    </div>
                    <div className="referral-list-status">
                      <span className={`status-badge referral-status-${referral.status}`}>{referral.status_label}</span>
                      <small>{referral.reward_amount.toFixed(2).replace('.', ',')} €</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="dashboard-empty">Ainda não enviaste nenhuma indicação.</p>
            )}
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DriverReferralsPage;
