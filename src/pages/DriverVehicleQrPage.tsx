import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';
import { IonButton, IonContent, IonPage } from '@ionic/react';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import DriverPageHeader from '../components/DriverPageHeader';
import { apiRequest } from '../lib/api';
import './Home.css';

type VehicleQrPreview = {
  vehicle: { id: number; license_plate: string };
  current_driver: { id: number; name: string } | null;
  state: string | null;
  can_confirm: boolean;
  driver: { id: number; name: string };
};

const DriverVehicleQrPage: React.FC = () => {
  const { token } = useAuth();
  const [qrToken, setQrToken] = useState('');
  const [preview, setPreview] = useState<VehicleQrPreview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadToken(value: string) {
    if (!token || !value) return;
    const parsed = value.split('/').filter(Boolean).pop() || '';
    setQrToken(parsed);
    setError(null);
    setMessage(null);
    try {
      setPreview(await apiRequest<VehicleQrPreview>(`/api/v1/mobile/driver/vehicle-qr/${encodeURIComponent(parsed)}`, { token }));
    } catch (scanError) {
      setPreview(null);
      setError(scanError instanceof Error ? scanError.message : 'Código QR inválido.');
    }
  }

  async function scan() {
    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
        scanInstructions: 'Aponte a câmara para o QR da viatura',
        cancelButtonAccessibilityLabel: 'Cancelar leitura',
      });
      const value = result.ScanResult;
      if (value) await loadToken(value);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Não foi possível ler o QR.');
    }
  }

  async function confirm() {
    if (!token || !qrToken) return;
    try {
      const result = await apiRequest<{ message: string }>(`/api/v1/mobile/driver/vehicle-qr/${encodeURIComponent(qrToken)}/confirm`, { method: 'POST', token });
      setMessage(result.message);
      setPreview(null);
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : 'Não foi possível assumir a viatura.');
    }
  }

  return <IonPage>
    <DriverPageHeader title="QR da viatura" subtitle="Ler e confirmar uma passagem" />
    <IonContent fullscreen className="home-page"><div className="home-shell home-shell-with-tabs">
      <section className="hero-panel"><div className="hero-copy-block"><p className="hero-eyebrow">Passagem rápida</p><h1>Assumir viatura</h1><p className="hero-copy">Lê o código da viatura e confirma os dados antes de alterar a atribuição.</p></div></section>
      {error ? <p className="status-error">{error}</p> : null}
      {message ? <p className="status-success">{message}</p> : null}
      <article className="dashboard-card"><IonButton onClick={() => void scan()}>Ler QR com a câmara</IonButton></article>
      {preview ? <article className="dashboard-card">
        <h3>{preview.vehicle.license_plate}</h3>
        <p>Atual: {preview.current_driver?.name || 'Sem motorista'}</p>
        {preview.state ? <p>Estado: {preview.state}</p> : null}
        <IonButton onClick={() => void confirm()} disabled={!preview.can_confirm}>Confirmar e assumir viatura</IonButton>
        {!preview.can_confirm ? <p className="status-warning">A viatura está bloqueada pelo estado operacional.</p> : null}
      </article> : null}
    </div></IonContent>
  </IonPage>;
};

export default DriverVehicleQrPage;
