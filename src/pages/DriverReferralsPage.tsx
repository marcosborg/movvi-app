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
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import DriverPageHeader from '../components/DriverPageHeader';
import { apiRequest } from '../lib/api';
import './Home.css';

const referralsPath = '/api/v1/mobile/driver/referrals';

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
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const saving = useRef(false);
  const loadSequence = useRef(0);
  const canSubmit = name.trim().length >= 3 && phone.replace(/\D/g, '').length >= 9 && consent;

  useEffect(() => {
    void loadReferrals();
  }, [token]);

  async function loadReferrals() {
    if (!token || saving.current) return;

    const sequence = ++loadSequence.current;
    setIsLoading(true);
    setLoadError(false);
    try {
      const result = await apiRequest<ReferralListResponse>(referralsPath, {
        method: 'GET',
        token,
      });
      if (sequence === loadSequence.current) setData(result);
    } catch {
      if (sequence === loadSequence.current) setLoadError(true);
    } finally {
      if (sequence === loadSequence.current) setIsLoading(false);
    }
  }

  async function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    await loadReferrals();
    event.detail.complete();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || saving.current || !canSubmit) return;

    saving.current = true;
    setIsSaving(true);
    setSaveError(null);
    setSuccess(null);

    try {
      const response = await apiRequest<ReferralCreateResponse>(referralsPath, {
        method: 'POST',
        token,
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), consent }),
      });
      loadSequence.current += 1;
      setIsLoading(false);
      setData((previous) => ({
        reward_amount: previous?.reward_amount ?? response.referral.reward_amount,
        qualification_days: previous?.qualification_days ?? 30,
        referrals: [response.referral, ...(previous?.referrals.filter(({ id }) => id !== response.referral.id) ?? [])],
      }));
      setSuccess(response.message);
      setName('');
      setPhone('');
      setConsent(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível registar a indicação.');
    } finally {
      saving.current = false;
      setIsSaving(false);
      void loadReferrals();
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

          <section className="dashboard-section">
            <article className="dashboard-card referral-form-card">
              <div className="card-head">
                <div>
                  <h3>Nova indicação</h3>
                  <p>Precisamos apenas do nome e do telefone.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="referral-form-grid">
                  <IonInput
                    label="Nome"
                    labelPlacement="stacked"
                    fill="outline"
                    value={name}
                    disabled={isSaving}
                    maxlength={160}
                    placeholder="Nome da pessoa"
                    onIonInput={(event) => setName(String(event.detail.value ?? ''))}
                  />
                  <IonInput
                    label="Telefone"
                    labelPlacement="stacked"
                    fill="outline"
                    type="tel"
                    inputmode="tel"
                    value={phone}
                    disabled={isSaving}
                    maxlength={40}
                    placeholder="Ex.: 912 345 678"
                    onIonInput={(event) => setPhone(String(event.detail.value ?? ''))}
                  />
                </div>

                <IonCheckbox className="referral-consent" labelPlacement="end" justify="start"
                  checked={consent} disabled={isSaving} onIonChange={(event) => setConsent(event.detail.checked)}>
                  <span className="ion-text-wrap">Confirmo que esta pessoa autorizou a Movvi a contactá-la sobre esta oportunidade.</span>
                </IonCheckbox>

                <IonButton expand="block" type="submit" disabled={isSaving || !canSubmit}>
                  {isSaving ? 'A enviar indicação…' : 'Enviar indicação'}
                </IonButton>
                {saveError ? <p className="status-error" role="alert">{saveError}</p> : null}
                {success ? <p className="status-success" role="status">{success}</p> : null}
              </form>
            </article>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-heading">
              <div>
                <p className="hero-eyebrow">Acompanhamento</p>
                <h2>As minhas indicações</h2>
              </div>
            </div>

            {loadError ? (
              <div className="dashboard-empty">
                Não foi possível atualizar a lista de indicações.
                <IonButton fill="clear" onClick={loadReferrals}>Tentar novamente</IonButton>
              </div>
            ) : null}
            {isLoading && !data ? (
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
            ) : !loadError ? (
              <p className="dashboard-empty">Ainda não enviaste nenhuma indicação.</p>
            ) : null}
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DriverReferralsPage;
