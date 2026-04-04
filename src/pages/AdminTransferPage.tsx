import {
  IonButton,
  IonContent,
  IonModal,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonToggle,
} from '@ionic/react';
import type { RefresherEventDetail } from '@ionic/core';
import { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import DriverPageHeader from '../components/DriverPageHeader';
import { apiRequest } from '../lib/api';
import {
  InspectionCreateOptionsResponse,
  InspectionMutationResponse,
} from './inspectionArea';
import './Home.css';

type TransferMode = 'entrega' | 'recolha' | 'passagem';

const transferModeOptions: Array<{
  key: TransferMode;
  label: string;
  description: string;
}> = [
  {
    key: 'entrega',
    label: 'Entrega',
    description: 'Entrega simples da viatura a um motorista.',
  },
  {
    key: 'recolha',
    label: 'Recolha',
    description: 'Recolha simples sem nova atribuicao.',
  },
  {
    key: 'passagem',
    label: 'Passagem',
    description: 'Fecha a utilizacao atual e entrega logo a outro motorista.',
  },
];

const AdminTransferPage: React.FC = () => {
  const history = useHistory();
  const { token, user } = useAuth();
  const [options, setOptions] = useState<InspectionCreateOptionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [targetDriverSearch, setTargetDriverSearch] = useState('');
  const [mode, setMode] = useState<TransferMode>('passagem');
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [showInspectionChoice, setShowInspectionChoice] = useState(false);
  const [form, setForm] = useState({
    vehicle_id: '',
    driver_id: '',
  });

  useEffect(() => {
    void loadOptions();
  }, [token, showAllOptions]);

  async function loadOptions() {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiRequest<InspectionCreateOptionsResponse>(`/api/v1/mobile/inspections/create-options?show_all=${showAllOptions ? '1' : '0'}`, {
        method: 'GET',
        token,
      });

      setOptions(response);
      setForm({
        vehicle_id: '',
        driver_id: '',
      });
      setVehicleSearch('');
      setTargetDriverSearch('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar os dados de passagem.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    await loadOptions();
    event.detail.complete();
  }

  const filteredVehicles = useMemo(() => {
    const needle = vehicleSearch.trim().toLowerCase();

    return (options?.vehicles ?? []).filter((vehicle) => {
      if (needle === '') {
        return true;
      }

      return [
        vehicle.license_plate,
        vehicle.driver_name ?? '',
      ].some((value) => value.toLowerCase().includes(needle));
    });
  }, [options?.vehicles, vehicleSearch]);

  const selectedVehicle = options?.vehicles.find((vehicle) => String(vehicle.id) === form.vehicle_id) || null;
  const selectedDriver = options?.drivers.find((driver) => String(driver.id) === form.driver_id) || null;
  const filteredDrivers = useMemo(() => {
    const needle = targetDriverSearch.trim().toLowerCase();

    return (options?.drivers ?? []).filter((driver) => {
      if (mode === 'passagem' && String(driver.id) === String(selectedVehicle?.driver_id ?? '')) {
        return false;
      }

      return needle === '' || driver.name.toLowerCase().includes(needle);
    });
  }, [options?.drivers, targetDriverSearch, mode, selectedVehicle?.driver_id]);

  const vehicleSuggestions = filteredVehicles.slice(0, 8);
  const driverSuggestions = filteredDrivers.slice(0, 8);

  const requiresTargetDriver = mode !== 'recolha';
  const sourceDriverName = selectedVehicle?.driver_name || 'Sem motorista atribuido';
  const primaryActionLabel = mode === 'recolha' ? 'Iniciar recolha' : mode === 'passagem' ? 'Iniciar passagem' : 'Iniciar entrega';
  const selectedVehicleWarning = selectedVehicle?.driver_id
    ? `A viatura ${selectedVehicle.license_plate} ja esta atribuida a ${selectedVehicle.driver_name || 'outro motorista'}. Ao continuar, a utilizacao atual sera fechada.`
    : null;
  const selectedDriverWarning = requiresTargetDriver && selectedDriver?.current_vehicle_id
    ? selectedDriver.current_vehicle_id === selectedVehicle?.id
      ? `${selectedDriver.name} ja esta associado a esta viatura.`
      : `${selectedDriver.name} ja tem a viatura ${selectedDriver.current_vehicle_license_plate || 'atual'} atribuida. Confirma a troca antes de continuar.`
    : null;

  function buildVehicleLabel(vehicle: InspectionCreateOptionsResponse['vehicles'][number]) {
    return `${vehicle.license_plate}${vehicle.driver_name ? ` · atual: ${vehicle.driver_name}` : ' · sem motorista'}`;
  }

  function selectVehicle(vehicleId: string) {
    const vehicle = options?.vehicles.find((item) => String(item.id) === vehicleId);
    setForm((current) => ({ ...current, vehicle_id: vehicleId }));
    setVehicleSearch(vehicle ? buildVehicleLabel(vehicle) : '');
    if (mode === 'passagem' && String(vehicle?.driver_id ?? '') === form.driver_id) {
      setForm((current) => ({ ...current, vehicle_id: vehicleId, driver_id: '' }));
      setTargetDriverSearch('');
    }
  }

  function selectDriver(driverId: string) {
    const driver = options?.drivers.find((item) => String(item.id) === driverId);
    setForm((current) => ({ ...current, driver_id: driverId }));
    setTargetDriverSearch(driver?.name || '');
  }

  async function executeTransfer(withInspection: boolean) {
    if (!token || !form.vehicle_id || (requiresTargetDriver && !form.driver_id)) {
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      if (!withInspection) {
        const response = await apiRequest<InspectionMutationResponse>('/api/v1/mobile/inspections/transfers', {
          method: 'POST',
          token,
          body: JSON.stringify({
            vehicle_id: Number(form.vehicle_id),
            driver_id: requiresTargetDriver ? Number(form.driver_id) : null,
            source_driver_id: selectedVehicle?.driver_id ?? null,
            transfer_mode: mode,
          }),
        });

        setShowInspectionChoice(false);
        setSuccess(response.message || 'Operacao registada com sucesso.');
        await loadOptions();
        return;
      }

      const response = await apiRequest<InspectionMutationResponse>('/api/v1/mobile/inspections', {
        method: 'POST',
        token,
        body: JSON.stringify({
          type: mode === 'recolha' ? 'return' : 'handover',
          vehicle_id: Number(form.vehicle_id),
          driver_id: requiresTargetDriver ? Number(form.driver_id) : null,
          source_driver_id: selectedVehicle?.driver_id ?? null,
          transfer_mode: mode,
        }),
      });

      if (response.inspection_id) {
        setShowInspectionChoice(false);
        history.push(`/dashboard/inspections/${response.inspection_id}`);
      }
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Nao foi possivel iniciar a operacao.');
    } finally {
      setIsCreating(false);
    }
  }

  function handleCreateTransfer() {
    if (!form.vehicle_id || (requiresTargetDriver && !form.driver_id)) {
      return;
    }

    setSuccess(null);
    setShowInspectionChoice(true);
  }

  return (
    <IonPage>
      <DriverPageHeader title="Passagens" subtitle="Entrega, recolha e troca de utilizacao" />
      <IonContent fullscreen className="home-page">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="home-shell home-shell-with-tabs">
          <section className="hero-panel">
            <div className="hero-copy-block">
              <p className="hero-eyebrow">Passagens</p>
              <h1>Registar utilizacao da viatura</h1>
              <p className="hero-copy">
                Usa este fluxo para registar uma entrega, uma recolha ou uma passagem, deixando a inspecao e a utilizacao alinhadas.
              </p>
            </div>
            <div className="hero-side">
              <div className="role-chip-row">
                <span className="role-chip">{user?.name || 'Admin'}</span>
                <span className="role-chip">{transferModeOptions.find((option) => option.key === mode)?.label || 'Operacao'}</span>
              </div>
            </div>
          </section>

          {isLoading ? (
            <div className="loading-state">
              <IonSpinner name="crescent" />
            </div>
          ) : null}

          {error ? <p className="status-error">{error}</p> : null}
          {success ? <p className="status-success">{success}</p> : null}

          {!isLoading ? (
            <section className="dashboard-section">
              <article className="dashboard-card transfer-mode-panel">
                <div className="card-head">
                  <div>
                    <h3>Operacao</h3>
                    <p>Escolhe primeiro o tipo de movimento da viatura.</p>
                  </div>
                </div>
                <div className="driver-choice-list transfer-mode-list">
                  {transferModeOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={`driver-choice-card transfer-mode-card ${mode === option.key ? 'driver-choice-card-active' : ''}`}
                      onClick={() => setMode(option.key)}
                    >
                      <strong>{option.label}</strong>
                      <span>{option.description}</span>
                    </button>
                  ))}
                </div>
              </article>

              <article className="dashboard-card">
                <div className="card-head">
                  <div>
                    <h3>Pesquisa e atribuicao</h3>
                    <p>Filtra a viatura e, quando aplicavel, escolhe o motorista.</p>
                  </div>
                </div>

                <div className="form-stack">
                  <label className="transfer-filter-row" htmlFor="transfer-show-all">
                    <div>
                      <strong>Mostrar tudo</strong>
                      <span>Mostra tambem viaturas ja atribuidas e motoristas que ja tem carro.</span>
                    </div>
                    <IonToggle
                      id="transfer-show-all"
                      checked={showAllOptions}
                      onIonChange={(event) => setShowAllOptions(event.detail.checked)}
                    />
                  </label>

                  <label className="form-label form-label-compact" htmlFor="transfer-vehicle-search">Viatura</label>
                  <input
                    id="transfer-vehicle-search"
                    className="text-field"
                    value={vehicleSearch}
                    onChange={(event) => {
                      setVehicleSearch(event.target.value);
                      setForm((current) => ({ ...current, vehicle_id: '' }));
                    }}
                    placeholder="Escreve a matrícula ou o nome do motorista atual"
                  />
                  <div className="transfer-picker-list">
                    {vehicleSuggestions.length > 0 ? vehicleSuggestions.map((vehicle) => (
                      <button
                        key={vehicle.id}
                        type="button"
                        className={`transfer-picker-option ${String(vehicle.id) === form.vehicle_id ? 'transfer-picker-option-active' : ''}`}
                        onClick={() => selectVehicle(String(vehicle.id))}
                      >
                        <strong>{vehicle.license_plate}</strong>
                        <span>{vehicle.driver_name ? `Atual: ${vehicle.driver_name}` : 'Sem motorista'}</span>
                      </button>
                    )) : <p className="dashboard-empty">Sem viaturas a corresponder à pesquisa.</p>}
                  </div>

                  {selectedVehicle ? (
                    <div className="submission-meta">
                      <span>Atual: {sourceDriverName}</span>
                      <span>Matricula: {selectedVehicle.license_plate}</span>
                    </div>
                  ) : null}
                  {selectedVehicleWarning ? <p className="status-warning">{selectedVehicleWarning}</p> : null}

                  {requiresTargetDriver ? (
                    <>
                      <label className="form-label form-label-compact" htmlFor="transfer-driver-search">
                        {mode === 'passagem' ? 'Motorista destino' : 'Motorista da entrega'}
                      </label>
                      <input
                        id="transfer-driver-search"
                        className="text-field"
                        value={targetDriverSearch}
                        onChange={(event) => {
                          setTargetDriverSearch(event.target.value);
                          setForm((current) => ({ ...current, driver_id: '' }));
                        }}
                        placeholder="Escreve o nome do motorista destino"
                      />
                      <div className="transfer-picker-list">
                        {driverSuggestions.length > 0 ? driverSuggestions.map((driver) => (
                          <button
                            key={driver.id}
                            type="button"
                            className={`transfer-picker-option ${String(driver.id) === form.driver_id ? 'transfer-picker-option-active' : ''}`}
                            onClick={() => selectDriver(String(driver.id))}
                          >
                            <strong>{driver.name}</strong>
                            <span>{driver.current_vehicle_license_plate ? `Atual: ${driver.current_vehicle_license_plate}` : 'Selecionar motorista'}</span>
                          </button>
                        )) : <p className="dashboard-empty">Sem motoristas a corresponder à pesquisa.</p>}
                      </div>
                    </>
                  ) : (
                    <div className="submission-meta">
                      <span>Ao fechar a inspecao, a viatura fica sem motorista associado.</span>
                    </div>
                  )}
                  {selectedDriverWarning ? <p className="status-warning">{selectedDriverWarning}</p> : null}

                  {selectedVehicle ? (
                    <article className="receipt-item action-item">
                      <div>
                        <strong>Resumo da operacao</strong>
                        <span>
                          {mode === 'recolha'
                            ? `${selectedVehicle.license_plate} recolhida de ${sourceDriverName}.`
                            : mode === 'passagem'
                              ? `${selectedVehicle.license_plate} passa de ${sourceDriverName} para ${selectedDriver?.name || 'motorista selecionado'}.`
                              : `${selectedVehicle.license_plate} entregue a ${selectedDriver?.name || 'motorista selecionado'}.`}
                        </span>
                      </div>
                    </article>
                  ) : null}

                  <IonButton onClick={() => void handleCreateTransfer()} disabled={!form.vehicle_id || (requiresTargetDriver && !form.driver_id) || isCreating}>
                    {isCreating ? 'A iniciar...' : primaryActionLabel}
                  </IonButton>
                </div>
              </article>
            </section>
          ) : null}
        </div>

        <IonModal isOpen={showInspectionChoice} onDidDismiss={() => setShowInspectionChoice(false)} initialBreakpoint={0.82} breakpoints={[0, 0.82, 1]}>
          <div className="finance-modal-shell">
            <div className="finance-modal-header">
              <div>
                <p className="hero-eyebrow">Confirmacao</p>
                <h2>Deseja realizar inspeção?</h2>
                <p className="finance-modal-copy">
                  Pode abrir o fluxo completo de inspeção ou registar apenas a operação de utilização da viatura.
                </p>
              </div>
              <IonButton fill="clear" onClick={() => setShowInspectionChoice(false)}>
                Fechar
              </IonButton>
            </div>

            <div className="dashboard-card-grid">
              <article className="dashboard-card">
                <h3>Com inspeção</h3>
                <p>Abre o wizard de inspeção e a alteração da utilização só fica concluída no fecho.</p>
                <div className="dashboard-actions dashboard-actions-top">
                  <IonButton onClick={() => void executeTransfer(true)} disabled={isCreating}>
                    {isCreating ? 'A iniciar...' : 'Sim, abrir inspeção'}
                  </IonButton>
                </div>
              </article>

              <article className="dashboard-card">
                <h3>Sem inspeção</h3>
                <p>Regista já a entrega, recolha ou passagem, sem abrir o fluxo de inspeção.</p>
                <div className="dashboard-actions dashboard-actions-top">
                  <IonButton fill="outline" onClick={() => void executeTransfer(false)} disabled={isCreating}>
                    {isCreating ? 'A registar...' : 'Não, só registar'}
                  </IonButton>
                </div>
              </article>
            </div>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default AdminTransferPage;
