import {
  IonButton,
  IonContent,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
} from '@ionic/react';
import type { RefresherEventDetail } from '@ionic/core';
import { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import DriverPageHeader from '../components/DriverPageHeader';
import { apiRequest } from '../lib/api';
import {
  InspectionCreateOptionsResponse,
  InspectionListResponse,
  InspectionMutationResponse,
} from './inspectionArea';
import './Home.css';

const DriverInspectionsPage: React.FC = () => {
  const history = useHistory();
  const { token, user } = useAuth();
  const [data, setData] = useState<InspectionListResponse | null>(null);
  const [options, setOptions] = useState<InspectionCreateOptionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plateQuery, setPlateQuery] = useState('');
  const [driverQuery, setDriverQuery] = useState('');
  const [createForm, setCreateForm] = useState({
    type: 'handover',
    vehicle_id: '',
    driver_id: '',
  });

  const isAdmin = Boolean(user?.roles.includes('Admin'));
  const filteredVehicles = useMemo(() => {
    const plateNeedle = plateQuery.trim().toLowerCase();
    const driverNeedle = driverQuery.trim().toLowerCase();

    return (options?.vehicles ?? []).filter((vehicle) => {
      const matchesPlate = plateNeedle === '' || vehicle.license_plate.toLowerCase().includes(plateNeedle);
      const matchesDriver = driverNeedle === '' || (vehicle.driver_name ?? '').toLowerCase().includes(driverNeedle);
      return matchesPlate && matchesDriver;
    });
  }, [options?.vehicles, plateQuery, driverQuery]);

  const filteredDrivers = useMemo(() => {
    const driverNeedle = driverQuery.trim().toLowerCase();

    return (options?.drivers ?? []).filter((driver) => {
      return driverNeedle === '' || driver.name.toLowerCase().includes(driverNeedle);
    });
  }, [options?.drivers, driverQuery]);

  useEffect(() => {
    void loadPage();
  }, [token]);

  async function loadPage() {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [inspections, createOptions] = await Promise.all([
        apiRequest<InspectionListResponse>('/api/v1/mobile/inspections', {
          method: 'GET',
          token,
        }),
        apiRequest<InspectionCreateOptionsResponse>('/api/v1/mobile/inspections/create-options', {
          method: 'GET',
          token,
        }),
      ]);

      setData(inspections);
      setOptions(createOptions);

      const firstVehicleId = createOptions.vehicles[0]?.id ? String(createOptions.vehicles[0].id) : '';
      const defaultDriverId = firstVehicleId
        ? String(createOptions.vehicles.find((vehicle) => String(vehicle.id) === firstVehicleId)?.driver_id ?? '')
        : '';

      setCreateForm((current) => ({
        type: createOptions.types.find((type) => type.key === current.type)?.key || createOptions.types[0]?.key || 'handover',
        vehicle_id: current.vehicle_id || firstVehicleId,
        driver_id: current.driver_id || (defaultDriverId === 'null' ? '' : defaultDriverId),
      }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar as inspecoes.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    await loadPage();
    event.detail.complete();
  }

  async function handleCreateInspection() {
    if (!token || !createForm.type || !createForm.vehicle_id) {
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await apiRequest<InspectionMutationResponse>('/api/v1/mobile/inspections', {
        method: 'POST',
        token,
        body: JSON.stringify({
          type: createForm.type,
          vehicle_id: Number(createForm.vehicle_id),
          driver_id: createForm.driver_id ? Number(createForm.driver_id) : null,
        }),
      });

      if (response.inspection_id) {
        history.push(`/dashboard/inspections/${response.inspection_id}`);
        return;
      }

      await loadPage();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Nao foi possivel iniciar a inspecao.');
    } finally {
      setIsCreating(false);
    }
  }

  function handleVehicleChange(value: string) {
    const matchedVehicle = options?.vehicles.find((vehicle) => String(vehicle.id) === value);

    setCreateForm((current) => ({
      ...current,
      vehicle_id: value,
      driver_id: matchedVehicle?.driver_id ? String(matchedVehicle.driver_id) : '',
    }));
  }

  if (!isAdmin) {
    return (
      <IonPage>
        <DriverPageHeader title="Inspecoes" subtitle="Acesso reservado a administradores" />
        <IonContent fullscreen className="home-page">
          <div className="home-shell home-shell-with-tabs">
            <article className="dashboard-card dashboard-warning">
              <h3>Acesso reservado</h3>
              <p>Na app Movvi, as inspeções ficam disponíveis apenas para utilizadores com role Admin.</p>
            </article>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <DriverPageHeader title="Inspecoes" subtitle="Inspeções geridas pelo administrador" />
      <IonContent fullscreen className="home-page">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="home-shell home-shell-with-tabs">
          <section className="hero-panel">
            <div className="hero-copy-block">
              <p className="hero-eyebrow">Inspecoes</p>
              <h1>Gestao central da frota</h1>
              <p className="hero-copy">
                Nesta app, as inspeções são sempre iniciadas pelo Admin. Escolhe o tipo, a viatura e o driver antes de abrir o wizard.
              </p>
            </div>
            <div className="hero-side">
              <div className="role-chip-row">
                <span className="role-chip">{user?.name || 'Admin'}</span>
                <span className="role-chip">Admin</span>
              </div>
            </div>
          </section>

          {isLoading ? (
            <div className="loading-state">
              <IonSpinner name="crescent" />
            </div>
          ) : null}

          {error ? <p className="status-error">{error}</p> : null}

          {!isLoading && !error ? (
            <>
              <section className="dashboard-section">
                <div className="dashboard-section-heading">
                  <div>
                    <p className="hero-eyebrow">Nova inspeção</p>
                    <h2>Abrir wizard</h2>
                  </div>
                </div>

                <article className="dashboard-card">
                  <div className="form-stack">
                    <div className="dashboard-card search-panel">
                      <div className="search-grid">
                        <div>
                          <label className="form-label" htmlFor="inspection-search-plate">Pesquisar matrícula</label>
                          <input
                            id="inspection-search-plate"
                            className="text-field"
                            value={plateQuery}
                            onChange={(event) => setPlateQuery(event.target.value)}
                            placeholder="AA-00-AA"
                          />
                        </div>
                        <div>
                          <label className="form-label" htmlFor="inspection-search-driver">Pesquisar driver</label>
                          <input
                            id="inspection-search-driver"
                            className="text-field"
                            value={driverQuery}
                            onChange={(event) => setDriverQuery(event.target.value)}
                            placeholder="Nome do driver"
                          />
                        </div>
                      </div>
                      <p className="dashboard-empty">
                        {filteredVehicles.length} viaturas e {filteredDrivers.length} drivers após filtro.
                      </p>
                    </div>

                    <label className="form-label" htmlFor="inspection-type">Tipo</label>
                    <select
                      id="inspection-type"
                      className="text-field"
                      value={createForm.type}
                      onChange={(event) => setCreateForm((current) => ({ ...current, type: event.target.value }))}
                    >
                      {(options?.types ?? []).map((type) => (
                        <option key={type.key} value={type.key}>{type.label}</option>
                      ))}
                    </select>

                    <label className="form-label" htmlFor="inspection-vehicle">Viatura</label>
                    <select
                      id="inspection-vehicle"
                      className="text-field"
                      value={createForm.vehicle_id}
                      onChange={(event) => handleVehicleChange(event.target.value)}
                    >
                      <option value="">Selecionar</option>
                      {filteredVehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.license_plate}{vehicle.driver_name ? ` · ${vehicle.driver_name}` : ''}
                        </option>
                      ))}
                    </select>

                    <label className="form-label" htmlFor="inspection-driver">Driver</label>
                    <select
                      id="inspection-driver"
                      className="text-field"
                      value={createForm.driver_id}
                      onChange={(event) => setCreateForm((current) => ({ ...current, driver_id: event.target.value }))}
                    >
                      <option value="">Sem driver</option>
                      {filteredDrivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>{driver.name}</option>
                      ))}
                    </select>

                    <IonButton onClick={() => void handleCreateInspection()} disabled={!createForm.vehicle_id || isCreating}>
                      {isCreating ? 'A iniciar...' : 'Criar inspeção'}
                    </IonButton>
                  </div>
                </article>
              </section>

              <section className="dashboard-section">
                <div className="dashboard-section-heading">
                  <div>
                    <p className="hero-eyebrow">Historico</p>
                    <h2>{data?.meta.total ?? 0} inspeções</h2>
                  </div>
                </div>

                <div className="dashboard-card-grid dashboard-card-grid-single">
                  {data?.data.length ? (
                    data.data.map((inspection) => (
                      <article key={inspection.id} className="dashboard-card inspection-list-card">
                        <div className="card-head">
                          <div>
                            <h3>{inspection.vehicle.license_plate || 'Sem matrícula'}</h3>
                            <p>{inspection.type_label} · {inspection.driver.name || 'Sem driver'}</p>
                          </div>
                          <span className={`status-badge status-${inspection.status}`}>
                            {inspection.status_label}
                          </span>
                        </div>
                        <div className="inspection-meta-grid">
                          <div>
                            <span className="metric-label">Etapa atual</span>
                            <strong>{inspection.current_step}</strong>
                          </div>
                          <div>
                            <span className="metric-label">Início</span>
                            <strong>{inspection.started_at || '-'}</strong>
                          </div>
                          <div>
                            <span className="metric-label">Fecho</span>
                            <strong>{inspection.locked_at || 'Em curso'}</strong>
                          </div>
                        </div>
                        <div className="dashboard-actions">
                          <IonButton
                            fill="outline"
                            onClick={() => history.push(`/dashboard/inspections/${inspection.id}`)}
                          >
                            Abrir fluxo
                          </IonButton>
                        </div>
                      </article>
                    ))
                  ) : (
                    <article className="dashboard-card">
                      <h3>Sem inspeções</h3>
                      <p>A primeira inspeção criada pelo Admin vai aparecer aqui.</p>
                    </article>
                  )}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DriverInspectionsPage;
