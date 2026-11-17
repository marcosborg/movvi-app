import { Capacitor } from '@capacitor/core';
import { IonButton, IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import DriverPageHeader from '../components/DriverPageHeader';
import { readPlateTextFromCamera } from '../components/VehiclePlateScanner';
import { apiRequest } from '../lib/api';
import './Home.css';

type VehiclePlatePreview = {
  vehicle: { id: number; license_plate: string };
  current_driver: { id: number; name: string } | null;
  state: string | null;
  can_confirm: boolean;
  driver: { id: number; name: string };
};

const DriverVehiclePlatePage: React.FC = () => {
  const { token } = useAuth();
  const [preview, setPreview] = useState<VehiclePlatePreview | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isNative = Capacitor.isNativePlatform();

  async function scan() {
    if (!token) return;

    setIsScanning(true);
    setPreview(null);
    setError(null);
    setMessage(null);

    try {
      const recognizedText = await readPlateTextFromCamera();
      const result = await apiRequest<VehiclePlatePreview>('/api/v1/mobile/driver/vehicle-plate/recognize', {
        method: 'POST',
        token,
        body: JSON.stringify({ recognized_text: recognizedText }),
      });
      setPreview(result);
    } catch (scanError) {
      const scanMessage = scanError instanceof Error ? scanError.message : 'Não foi possível ler a matrícula.';
      if (!/cancel/i.test(scanMessage)) setError(scanMessage);
    } finally {
      setIsScanning(false);
    }
  }

  async function confirm() {
    if (!token || !preview) return;

    setIsConfirming(true);
    setError(null);
    try {
      const result = await apiRequest<{ message: string }>(`/api/v1/mobile/driver/vehicle-plate/${preview.vehicle.id}/confirm`, {
        method: 'POST',
        token,
      });
      setMessage(result.message);
      setPreview(null);
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : 'Não foi possível assumir a viatura.');
    } finally {
      setIsConfirming(false);
    }
  }

  return <IonPage>
    <DriverPageHeader title="Matrícula" subtitle="Ler e confirmar uma passagem" />
    <IonContent fullscreen className="home-page"><div className="home-shell home-shell-with-tabs">
      <section className="hero-panel"><div className="hero-copy-block"><p className="hero-eyebrow">Passagem rápida</p><h1>Assumir viatura</h1><p className="hero-copy">Aponta a câmara para a matrícula e confirma os dados antes de alterar a atribuição.</p></div></section>
      {error ? <p className="status-error">{error}</p> : null}
      {message ? <p className="status-success">{message}</p> : null}
      <article className="dashboard-card">
        {isNative ? (
          <IonButton expand="block" onClick={() => void scan()} disabled={isScanning || isConfirming}>
            {isScanning ? <IonSpinner name="crescent" /> : null}
            {isScanning ? 'A ler matrícula...' : 'Ler matrícula com a câmara'}
          </IonButton>
        ) : <p className="dashboard-empty">A leitura da matrícula está disponível nas apps Android e iPhone.</p>}
        <p className="dashboard-help">Enquadra apenas a matrícula, de frente e com boa luz.</p>
      </article>
      {preview ? <article className="dashboard-card">
        <h3>{preview.vehicle.license_plate}</h3>
        <p>Atual: {preview.current_driver?.name || 'Sem motorista'}</p>
        {preview.state ? <p>Estado: {preview.state}</p> : null}
        <IonButton onClick={() => void confirm()} disabled={!preview.can_confirm || isConfirming}>
          {isConfirming ? 'A confirmar...' : 'Confirmar e assumir viatura'}
        </IonButton>
        {!preview.can_confirm ? <p className="status-warning">A viatura está bloqueada pelo estado operacional.</p> : null}
      </article> : null}
    </div></IonContent>
  </IonPage>;
};

export default DriverVehiclePlatePage;
