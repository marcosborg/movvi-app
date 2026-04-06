import {
  IonButton,
  IonContent,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
} from '@ionic/react';
import type { RefresherEventDetail } from '@ionic/core';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import DriverPageHeader from '../components/DriverPageHeader';
import DriverWeekPicker from '../components/DriverWeekPicker';
import { useDriverWeek } from '../components/DriverWeekContext';
import { apiRequest } from '../lib/api';
import { DriverReceiptMutationResponse, DriverWeeklyEvaluationResponse } from './driverArea';
import './Home.css';

type EvaluationFormState = {
  vehicle_id: string;
  final_mileage: string;
  fuel_level: string;
  front_tire_status: string;
  rear_tire_status: string;
  oil_level: string;
  has_panel_warning: boolean;
  panel_warning_notes: string;
  has_vehicle_issue: boolean;
  issue_notes: string;
};

const emptyForm: EvaluationFormState = {
  vehicle_id: '',
  final_mileage: '',
  fuel_level: '',
  front_tire_status: '',
  rear_tire_status: '',
  oil_level: '',
  has_panel_warning: false,
  panel_warning_notes: '',
  has_vehicle_issue: false,
  issue_notes: '',
};

const DriverWeeklyEvaluationPage: React.FC = () => {
  const { token } = useAuth();
  const { selectedWeek } = useDriverWeek();
  const [data, setData] = useState<DriverWeeklyEvaluationResponse | null>(null);
  const [form, setForm] = useState<EvaluationFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [panelPhoto, setPanelPhoto] = useState<File | null>(null);

  useEffect(() => {
    void loadEvaluation();
  }, [token, selectedWeek]);

  async function loadEvaluation(vehicleId?: string) {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedWeek) {
        params.set('date', selectedWeek);
      }
      if (vehicleId) {
        params.set('vehicle_id', vehicleId);
      }

      const response = await apiRequest<DriverWeeklyEvaluationResponse>(
        `/api/v1/mobile/driver/weekly-evaluation${params.size ? `?${params.toString()}` : ''}`,
        {
          method: 'GET',
          token,
        },
      );

      setData(response);

      const preferredVehicle = vehicleId || String(response.evaluation?.vehicle_id || response.vehicles[0]?.id || '');
      setForm({
        vehicle_id: preferredVehicle,
        final_mileage: response.evaluation?.final_mileage ? String(response.evaluation.final_mileage) : '',
        fuel_level: response.evaluation?.fuel_level || '',
        front_tire_status: response.evaluation?.front_tire_status || '',
        rear_tire_status: response.evaluation?.rear_tire_status || '',
        oil_level: response.evaluation?.oil_level || '',
        has_panel_warning: response.evaluation?.has_panel_warning || false,
        panel_warning_notes: response.evaluation?.panel_warning_notes || '',
        has_vehicle_issue: response.evaluation?.has_vehicle_issue || false,
        issue_notes: response.evaluation?.issue_notes || '',
      });
      setPanelPhoto(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar a avaliacao semanal.');
      setData(null);
      setForm(emptyForm);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    await loadEvaluation(form.vehicle_id || undefined);
    event.detail.complete();
  }

  async function handleVehicleChange(vehicleId: string) {
    setForm((current) => ({ ...current, vehicle_id: vehicleId }));
    setSuccess(null);
    await loadEvaluation(vehicleId || undefined);
  }

  async function handleSubmit() {
    if (!token || !selectedWeek) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const body = new FormData();
      body.append('date', selectedWeek);
      body.append('vehicle_id', String(Number(form.vehicle_id)));
      body.append('final_mileage', String(Number(form.final_mileage)));
      body.append('fuel_level', form.fuel_level);
      body.append('front_tire_status', form.front_tire_status);
      body.append('rear_tire_status', form.rear_tire_status);
      body.append('oil_level', form.oil_level);
      body.append('has_panel_warning', form.has_panel_warning ? '1' : '0');
      body.append('panel_warning_notes', form.has_panel_warning ? form.panel_warning_notes : '');
      body.append('has_vehicle_issue', form.has_vehicle_issue ? '1' : '0');
      body.append('issue_notes', form.has_vehicle_issue ? form.issue_notes : '');

      if (form.has_panel_warning && panelPhoto) {
        body.append('panel_photo', panelPhoto);
      }

      const response = await apiRequest<DriverReceiptMutationResponse>('/api/v1/mobile/driver/weekly-evaluation', {
        method: 'POST',
        token,
        body,
      });

      setSuccess(response.message);
      await loadEvaluation(form.vehicle_id || undefined);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Nao foi possivel submeter a avaliacao.');
    } finally {
      setIsSaving(false);
    }
  }

  const hasVehicles = (data?.vehicles.length ?? 0) > 0;

  return (
    <IonPage>
      <DriverPageHeader title="Semanal" subtitle="Avaliacao semanal da viatura" />
      <IonContent fullscreen className="home-page">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="home-shell home-shell-with-tabs">
          <DriverWeekPicker />

          <section className="hero-panel">
            <div className="hero-copy-block">
              <p className="hero-eyebrow">Avaliacao semanal</p>
              <h1>{data?.driver?.name || 'Motorista'}</h1>
              <p className="hero-copy">
                Regista quilometragem final, combustivel, pneus, oleo, painel e eventuais problemas da viatura.
              </p>
              <p className="hero-copy hero-copy-muted">
                A submissao fica associada a semana ativa e pode ser atualizada para a mesma viatura.
              </p>
            </div>
            <div className="hero-side">
              <div className="role-chip-row">
                <span className="role-chip">Semana {data?.week.number ?? '-'}</span>
                {data?.evaluation?.submitted_at ? <span className="role-chip">Preenchido</span> : <span className="role-chip">Por preencher</span>}
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

          {!isLoading && data ? (
            <>
              <section className="dashboard-section">
                <div className="dashboard-card-grid">
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Semana ativa</p>
                    <strong>{data.week.start_date} a {data.week.end_date}</strong>
                    <span>O formulario fica guardado nesta janela temporal.</span>
                  </article>
                  <article className="dashboard-card dashboard-metric-card">
                    <p className="metric-label">Estado</p>
                    <strong>{data.evaluation?.submitted_at ? 'Submetido' : 'Pendente'}</strong>
                    <span>{data.evaluation?.submitted_at || 'Ainda sem resposta nesta semana/viatura.'}</span>
                  </article>
                </div>
              </section>

              <section className="dashboard-section">
                <article className="dashboard-card">
                  <div className="card-head">
                    <div>
                      <h3>Checklist da semana</h3>
                      <p>Escolhe a viatura e preenche os campos obrigatorios.</p>
                    </div>
                  </div>

                  {hasVehicles ? (
                    <div className="form-stack">
                      <label className="form-label" htmlFor="weekly-eval-vehicle">Viatura utilizada</label>
                      <select
                        id="weekly-eval-vehicle"
                        className="text-field"
                        value={form.vehicle_id}
                        onChange={(event) => void handleVehicleChange(event.target.value)}
                      >
                        <option value="">Selecionar</option>
                        {data.vehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.label}
                          </option>
                        ))}
                      </select>

                      <label className="form-label" htmlFor="weekly-eval-mileage">Quilometragem final</label>
                      <input
                        id="weekly-eval-mileage"
                        className="text-field"
                        type="number"
                        min="1"
                        placeholder="Exemplo 138425"
                        value={form.final_mileage}
                        onChange={(event) => setForm((current) => ({ ...current, final_mileage: event.target.value }))}
                      />

                      <label className="form-label" htmlFor="weekly-eval-fuel">Combustivel / energia</label>
                      <select
                        id="weekly-eval-fuel"
                        className="text-field"
                        value={form.fuel_level}
                        onChange={(event) => setForm((current) => ({ ...current, fuel_level: event.target.value }))}
                      >
                        <option value="">Selecionar</option>
                        {Object.entries(data.options.fuel_levels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>

                      <label className="form-label" htmlFor="weekly-eval-front-tires">Estado dos pneus dianteiros</label>
                      <select
                        id="weekly-eval-front-tires"
                        className="text-field"
                        value={form.front_tire_status}
                        onChange={(event) => setForm((current) => ({ ...current, front_tire_status: event.target.value }))}
                      >
                        <option value="">Selecionar</option>
                        {Object.entries(data.options.tire_statuses).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>

                      <label className="form-label" htmlFor="weekly-eval-rear-tires">Estado dos pneus traseiros</label>
                      <select
                        id="weekly-eval-rear-tires"
                        className="text-field"
                        value={form.rear_tire_status}
                        onChange={(event) => setForm((current) => ({ ...current, rear_tire_status: event.target.value }))}
                      >
                        <option value="">Selecionar</option>
                        {Object.entries(data.options.tire_statuses).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>

                      <label className="form-label" htmlFor="weekly-eval-oil">Nivel do oleo</label>
                      <select
                        id="weekly-eval-oil"
                        className="text-field"
                        value={form.oil_level}
                        onChange={(event) => setForm((current) => ({ ...current, oil_level: event.target.value }))}
                      >
                        <option value="">Selecionar</option>
                        {Object.entries(data.options.oil_levels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>

                      <label className="inspection-checkbox">
                        <input
                          type="checkbox"
                          checked={form.has_panel_warning}
                          onChange={(event) => {
                            const checked = event.target.checked;
                            setForm((current) => ({
                              ...current,
                              has_panel_warning: checked,
                              panel_warning_notes: checked ? current.panel_warning_notes : '',
                            }));
                            if (!checked) {
                              setPanelPhoto(null);
                            }
                          }}
                        />
                        <span>Existem avisos no painel</span>
                      </label>

                      {form.has_panel_warning ? (
                        <>
                          <label className="form-label" htmlFor="weekly-eval-panel-notes">Descreve os avisos no painel</label>
                          <textarea
                            id="weekly-eval-panel-notes"
                            className="text-field text-area-field"
                            value={form.panel_warning_notes}
                            onChange={(event) => setForm((current) => ({ ...current, panel_warning_notes: event.target.value }))}
                          />

                          <label className="form-label" htmlFor="weekly-eval-panel-photo">Foto do painel</label>
                          <input
                            id="weekly-eval-panel-photo"
                            className="text-field"
                            type="file"
                            accept="image/*"
                            onChange={(event) => setPanelPhoto(event.target.files?.[0] ?? null)}
                          />
                          {panelPhoto ? <p className="helper-text">{panelPhoto.name}</p> : null}
                          {!panelPhoto && data.evaluation?.panel_photo ? (
                            <p className="helper-text">
                              Foto atual: <a href={data.evaluation.panel_photo.url} target="_blank" rel="noreferrer">{data.evaluation.panel_photo.name}</a>
                            </p>
                          ) : null}
                        </>
                      ) : null}

                      <label className="inspection-checkbox">
                        <input
                          type="checkbox"
                          checked={form.has_vehicle_issue}
                          onChange={(event) => setForm((current) => ({
                            ...current,
                            has_vehicle_issue: event.target.checked,
                            issue_notes: event.target.checked ? current.issue_notes : '',
                          }))}
                        />
                        <span>Existe algum problema no veiculo</span>
                      </label>

                      {form.has_vehicle_issue ? (
                        <>
                          <label className="form-label" htmlFor="weekly-eval-notes">Descreve o problema</label>
                          <textarea
                            id="weekly-eval-notes"
                            className="text-field text-area-field"
                            value={form.issue_notes}
                            onChange={(event) => setForm((current) => ({ ...current, issue_notes: event.target.value }))}
                          />
                        </>
                      ) : null}

                      <div className="dashboard-actions dashboard-actions-top">
                        <IonButton
                          onClick={() => void handleSubmit()}
                          disabled={
                            isSaving
                            || !form.vehicle_id
                            || !form.final_mileage
                            || !form.fuel_level
                            || !form.front_tire_status
                            || !form.rear_tire_status
                            || !form.oil_level
                            || (form.has_panel_warning && !panelPhoto && !data.evaluation?.panel_photo)
                            || (form.has_vehicle_issue && form.issue_notes.trim() === '')
                          }
                        >
                          {isSaving ? 'A guardar...' : (data.evaluation ? 'Atualizar avaliacao' : 'Submeter avaliacao')}
                        </IonButton>
                      </div>
                    </div>
                  ) : (
                    <p className="dashboard-empty">Nao foi encontrada nenhuma viatura associada a este motorista na semana escolhida.</p>
                  )}
                </article>
              </section>
            </>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DriverWeeklyEvaluationPage;
