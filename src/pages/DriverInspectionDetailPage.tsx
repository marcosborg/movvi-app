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
import { useHistory, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import DriverPageHeader from '../components/DriverPageHeader';
import ImageSourceField from '../components/ImageSourceField';
import SignaturePad from '../components/SignaturePad';
import { apiRequest } from '../lib/api';
import {
  accessoryLabels,
  documentLabels,
  getStepEntries,
  InspectionMutationResponse,
  InspectionShowResponse,
  operationalLabels,
} from './inspectionArea';
import './Home.css';

type RouteParams = {
  id: string;
};

type ChecklistState = Record<string, Record<string, string | number | boolean | null>>;

const DriverInspectionDetailPage: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const history = useHistory();
  const { token } = useAuth();
  const [data, setData] = useState<InspectionShowResponse | null>(null);
  const [checklist, setChecklist] = useState<ChecklistState>({});
  const [extraObservations, setExtraObservations] = useState('');
  const [driverSignatureName, setDriverSignatureName] = useState('');
  const [responsibleSignatureName, setResponsibleSignatureName] = useState('');
  const [driverSignatureData, setDriverSignatureData] = useState('');
  const [responsibleSignatureData, setResponsibleSignatureData] = useState('');
  const [damageForm, setDamageForm] = useState({
    location: '',
    part: '',
    part_section: '',
    damage_type: '',
    damage_notes: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [driverSearch, setDriverSearch] = useState('');

  useEffect(() => {
    void loadInspection();
  }, [id, token]);

  async function loadInspection() {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiRequest<InspectionShowResponse>(`/api/v1/mobile/inspections/${id}`, {
        method: 'GET',
        token,
      });

      setData(response);
      setChecklist(response.checklist ?? {});
      setExtraObservations(response.inspection.extra_observations || '');
      setDriverSignatureName(response.signatures.driver || response.inspection.driver.name || '');
      setResponsibleSignatureName(response.signatures.responsible || '');
      setDriverSignatureData('');
      setResponsibleSignatureData('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar a inspecao.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    await loadInspection();
    event.detail.complete();
  }

  const currentStep = data?.inspection.current_step ?? 1;
  const isManager = Boolean(data?.meta.is_admin);
  const stepEntries = data ? getStepEntries(data.steps) : [];
  const damageParts = useMemo(() => {
    const location = damageForm.location;
    if (!location || !data) {
      return [];
    }

    return Object.entries(data.damage_parts[location]?.sections ?? {});
  }, [data, damageForm.location]);
  const filteredDriverOptions = useMemo(() => {
    const needle = driverSearch.trim().toLowerCase();
    return (data?.driver_options ?? []).filter((driver) => needle === '' || driver.name.toLowerCase().includes(needle));
  }, [data?.driver_options, driverSearch]);

  function getChecklistValue(groupKey: string, itemKey: string, fallback: string | number | boolean | null = null) {
    return checklist[groupKey]?.[itemKey] ?? fallback;
  }

  function setChecklistValue(groupKey: string, itemKey: string, value: string | number | boolean | null) {
    setChecklist((current) => ({
      ...current,
      [groupKey]: {
        ...(current[groupKey] ?? {}),
        [itemKey]: value,
      },
    }));
  }

  function setFileBucket(key: string, fileList: FileList | null) {
    const incoming = Array.from(fileList ?? []);

    setSelectedFiles((current) => ({
      ...current,
      [key]: [
        ...(current[key] ?? []),
        ...incoming,
      ].filter((file, index, all) => {
        return all.findIndex((candidate) => (
          candidate.name === file.name
          && candidate.size === file.size
          && candidate.lastModified === file.lastModified
        )) === index;
      }),
    }));
  }

  function appendFiles(formData: FormData, key: string, files: File[] | undefined) {
    files?.forEach((file) => formData.append(key, file));
  }

  function buildStepPayload(step: number, action: 'save' | 'complete') {
    const formData = new FormData();
    formData.append('step', String(step));
    formData.append('action', action);

    if (step === 3) {
      data?.document_keys.forEach((key) => {
        formData.append(`checklist[documents][${key}]`, getChecklistValue('documents', key, false) ? '1' : '0');
        appendFiles(formData, `checklist_photos[${key}][]`, selectedFiles[`doc_${key}`]);
      });
    }

    if (step === 2 && data?.inspection.driver.id) {
      formData.append('driver_id', String(data.inspection.driver.id));
    }

    if (step === 4) {
      formData.append(`checklist[cleanliness][external]`, String(getChecklistValue('cleanliness', 'external', 0)));
      formData.append(`checklist[cleanliness][interior]`, String(getChecklistValue('cleanliness', 'interior', 0)));
      formData.append(`checklist[fuel_energy][level]`, String(getChecklistValue('fuel_energy', 'level', 0)));
      formData.append(`checklist[mileage][odometer_km]`, String(getChecklistValue('mileage', 'odometer_km', '')));
      formData.append(`checklist[tire_condition][level]`, String(getChecklistValue('tire_condition', 'level', 0)));
      formData.append(`checklist[panel_warnings][panel_warning]`, getChecklistValue('panel_warnings', 'panel_warning', false) ? '1' : '0');
      appendFiles(formData, 'checklist_photos[panel_warning][]', selectedFiles.panel_warning);
    }

    if (step === 5) {
      data?.accessory_keys.forEach((key) => {
        formData.append(`checklist[accessories][${key}_present]`, getChecklistValue('accessories', `${key}_present`, false) ? '1' : '0');
        appendFiles(formData, `checklist_photos[${key}][]`, selectedFiles[`acc_${key}`]);
      });
    }

    if (step === 6) {
      data?.required_slots.exterior.forEach((slot) => {
        appendFiles(formData, `exterior_photos[${slot}][]`, selectedFiles[`ext_${slot}`]);
      });
    }

    if (step === 7) {
      data?.required_slots.interior.forEach((slot) => {
        appendFiles(formData, `interior_photos[${slot}][]`, selectedFiles[`int_${slot}`]);
      });
    }

    if (step === 8 || step === 9) {
      if (damageForm.location) {
        formData.append('location', damageForm.location);
        formData.append('part', damageForm.part);
        formData.append('part_section', damageForm.part_section);
        formData.append('damage_type', damageForm.damage_type);
        formData.append('damage_notes', damageForm.damage_notes);
        appendFiles(formData, 'damage_photo[]', selectedFiles.damage_photo);
      }
    }

    if (step === 10) {
      formData.append('extra_observations', extraObservations);
      appendFiles(formData, 'extra_photos[]', selectedFiles.extra_photos);
    }

    if (step === 11) {
      formData.append('driver_signature_name', driverSignatureName);
      if (driverSignatureData) {
        formData.append('driver_signature_data', driverSignatureData);
      }
      if (isManager && responsibleSignatureName) {
        formData.append('inspector_name', responsibleSignatureName);
        if (responsibleSignatureData) {
          formData.append('inspector_signature_data', responsibleSignatureData);
        }
      }
    }

    return formData;
  }

  async function submitStep(action: 'save' | 'complete') {
    if (!token || !data) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiRequest<InspectionMutationResponse>(
        `/api/v1/mobile/inspections/${data.inspection.id}/step`,
        {
          method: 'POST',
          token,
          body: buildStepPayload(currentStep, action),
        },
      );

      setSuccess(response.message);
      if (currentStep === 8 || currentStep === 9) {
        setDamageForm({
          location: '',
          part: '',
          part_section: '',
          damage_type: '',
          damage_notes: '',
        });
        setSelectedFiles((current) => ({ ...current, damage_photo: [] }));
      }
      await loadInspection();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Nao foi possivel guardar a etapa.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleBackStep() {
    if (!token || !data) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiRequest<InspectionMutationResponse>(
        `/api/v1/mobile/inspections/${data.inspection.id}/back-step`,
        { method: 'POST', token },
      );
      setSuccess(response.message);
      await loadInspection();
    } catch (backError) {
      setError(backError instanceof Error ? backError.message : 'Nao foi possivel voltar atras.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCloseInspection() {
    if (!token || !data) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiRequest<InspectionMutationResponse>(
        `/api/v1/mobile/inspections/${data.inspection.id}/close`,
        { method: 'POST', token },
      );
      setSuccess(response.message);
      await loadInspection();
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : 'Nao foi possivel fechar a inspecao.');
    } finally {
      setIsSaving(false);
    }
  }

  function renderPhotoThumbs(category: string, slot?: string) {
    const items = (data?.photos ?? []).filter((photo) => photo.category === category && (slot ? photo.slot === slot : true));

    if (!items.length) {
      return <p className="dashboard-empty">Sem ficheiros carregados.</p>;
    }

    return (
      <div className="inspection-thumb-grid">
        {items.map((photo) => (
          <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer" className="inspection-thumb-card">
            {/\.(pdf)(\?|$)/i.test(photo.url) ? (
              <span className="inspection-file-link">{photo.original_name || 'Abrir ficheiro'}</span>
            ) : (
              <img src={photo.url} alt={photo.original_name || photo.slot || category} />
            )}
          </a>
        ))}
      </div>
    );
  }

  function renderStepBody() {
    if (!data) {
      return null;
    }

    if (currentStep === 1) {
      return (
        <div className="form-stack">
          <p>Viatura: {data.inspection.vehicle.license_plate || '-'}</p>
          <p>{data.inspection.vehicle.brand || ''} {data.inspection.vehicle.model || ''} {data.inspection.vehicle.year || ''}</p>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="form-stack">
          <p>Condutor associado: {data.inspection.driver.name || 'Sem condutor'}</p>
          <p>Escolhe aqui o condutor destino da viatura. O nome fica logo aplicado quando guardares ou concluíres a etapa.</p>
          <label className="form-label" htmlFor="driver-search">Pesquisar motorista</label>
          <input
            id="driver-search"
            className="text-field"
            value={driverSearch}
            onChange={(event) => setDriverSearch(event.target.value)}
            placeholder="Nome do motorista"
          />
          <div className="driver-choice-list">
            {filteredDriverOptions.map((driver) => (
              <button
                key={driver.id}
                type="button"
                className={`driver-choice-card ${
                  String(data.inspection.driver.id ?? '') === String(driver.id) ? 'driver-choice-card-active' : ''
                }`}
                onClick={() => {
                  if (!data) {
                    return;
                  }

                  setData({
                    ...data,
                    inspection: {
                      ...data.inspection,
                      driver: {
                        id: driver.id,
                        name: driver.name,
                      },
                    },
                  });
                }}
              >
                <strong>{driver.name}</strong>
                <span>{String(data.inspection.driver.id ?? '') === String(driver.id) ? 'Selecionado' : 'Selecionar'}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className="form-stack">
          {data.document_keys.map((key) => (
            <div key={key} className="inspection-field-block">
              <label className="inspection-checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(getChecklistValue('documents', key, false))}
                  onChange={(event) => setChecklistValue('documents', key, event.target.checked)}
                />
                <span>{documentLabels[key] || key}</span>
              </label>
              <ImageSourceField
                label="Anexos"
                multiple
                galleryAccept=".pdf,image/*"
                galleryLabel="Galeria / ficheiros"
                onFilesSelected={(files) => setFileBucket(`doc_${key}`, files)}
              />
              {renderPhotoThumbs('document', `doc_${key}`)}
            </div>
          ))}
        </div>
      );
    }

    if (currentStep === 4) {
      return (
        <div className="form-stack">
          <label className="form-label" htmlFor="clean-ext">Limpeza exterior (0-10)</label>
          <input id="clean-ext" className="text-field" type="number" min="0" max="10" value={String(getChecklistValue('cleanliness', 'external', 0))} onChange={(event) => setChecklistValue('cleanliness', 'external', Number(event.target.value))} />
          <label className="form-label" htmlFor="clean-int">Limpeza interior (0-10)</label>
          <input id="clean-int" className="text-field" type="number" min="0" max="10" value={String(getChecklistValue('cleanliness', 'interior', 0))} onChange={(event) => setChecklistValue('cleanliness', 'interior', Number(event.target.value))} />
          <label className="form-label" htmlFor="fuel-level">Combustivel / energia (0-10)</label>
          <input id="fuel-level" className="text-field" type="number" min="0" max="10" value={String(getChecklistValue('fuel_energy', 'level', 0))} onChange={(event) => setChecklistValue('fuel_energy', 'level', Number(event.target.value))} />
          <label className="form-label" htmlFor="mileage">Quilometragem</label>
          <input id="mileage" className="text-field" type="number" min="0" value={String(getChecklistValue('mileage', 'odometer_km', ''))} onChange={(event) => setChecklistValue('mileage', 'odometer_km', event.target.value)} />
          <label className="form-label" htmlFor="tires">Estado dos pneus (0-10)</label>
          <input id="tires" className="text-field" type="number" min="0" max="10" value={String(getChecklistValue('tire_condition', 'level', 0))} onChange={(event) => setChecklistValue('tire_condition', 'level', Number(event.target.value))} />
          <label className="inspection-checkbox">
            <input type="checkbox" checked={Boolean(getChecklistValue('panel_warnings', 'panel_warning', false))} onChange={(event) => setChecklistValue('panel_warnings', 'panel_warning', event.target.checked)} />
            <span>{operationalLabels.panel_warnings}</span>
          </label>
          <ImageSourceField
            label="Foto de avisos no painel"
            multiple
            onFilesSelected={(files) => setFileBucket('panel_warning', files)}
          />
          {renderPhotoThumbs('document', 'doc_panel_warning')}
        </div>
      );
    }

    if (currentStep === 5) {
      return (
        <div className="form-stack">
          {data.accessory_keys.map((key) => (
            <div key={key} className="inspection-field-block">
              <label className="inspection-checkbox">
                <input type="checkbox" checked={Boolean(getChecklistValue('accessories', `${key}_present`, false))} onChange={(event) => setChecklistValue('accessories', `${key}_present`, event.target.checked)} />
                <span>{accessoryLabels[key] || key}</span>
              </label>
              <ImageSourceField
                label="Foto do acessorio"
                multiple
                onFilesSelected={(files) => setFileBucket(`acc_${key}`, files)}
              />
              {renderPhotoThumbs('document', `doc_${key}`)}
            </div>
          ))}
        </div>
      );
    }

    if (currentStep === 6 || currentStep === 7) {
      const category = currentStep === 6 ? 'exterior' : 'interior';
      const slots = currentStep === 6 ? data.required_slots.exterior : data.required_slots.interior;
      const labels = currentStep === 6 ? data.slot_labels.exterior : data.slot_labels.interior;
      const prefix = currentStep === 6 ? 'ext_' : 'int_';

      return (
        <div className="form-stack">
          {slots.map((slot) => (
            <div key={slot} className="inspection-field-block">
              <label className="form-label">{labels[slot] || slot}</label>
              <ImageSourceField
                label="Fotografia"
                multiple
                onFilesSelected={(files) => setFileBucket(`${prefix}${slot}`, files)}
              />
              {renderPhotoThumbs(category, slot)}
            </div>
          ))}
        </div>
      );
    }

    if (currentStep === 8 || currentStep === 9) {
      const scope = currentStep === 8 ? 'exterior' : 'interior';
      const damages = data.damages.filter((damage) => damage.scope === scope);

      return (
        <div className="form-stack">
          <label className="form-label" htmlFor="damage-location">Localizacao</label>
          <select id="damage-location" className="text-field" value={damageForm.location} onChange={(event) => setDamageForm((current) => ({ ...current, location: event.target.value, part: '' }))}>
            <option value="">Selecionar</option>
            {Object.entries(data.damage_locations).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <label className="form-label" htmlFor="damage-part">Peca</label>
          <select id="damage-part" className="text-field" value={damageForm.part} onChange={(event) => setDamageForm((current) => ({ ...current, part: event.target.value }))}>
            <option value="">Selecionar</option>
            {damageParts.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <label className="form-label" htmlFor="damage-type">Tipo de dano</label>
          <select id="damage-type" className="text-field" value={damageForm.damage_type} onChange={(event) => setDamageForm((current) => ({ ...current, damage_type: event.target.value }))}>
            <option value="">Selecionar</option>
            {Object.entries(data.damage_types).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <label className="form-label" htmlFor="damage-section">Subparte</label>
          <input id="damage-section" className="text-field" value={damageForm.part_section} onChange={(event) => setDamageForm((current) => ({ ...current, part_section: event.target.value }))} />
          <label className="form-label" htmlFor="damage-notes">Observacoes</label>
          <textarea id="damage-notes" className="text-field text-area-field" value={damageForm.damage_notes} onChange={(event) => setDamageForm((current) => ({ ...current, damage_notes: event.target.value }))} />
          <ImageSourceField
            label="Fotos do dano"
            multiple
            onFilesSelected={(files) => setFileBucket('damage_photo', files)}
          />

          <div className="inspection-damages-list">
            {damages.length ? damages.map((damage) => (
              <article key={damage.id} className="receipt-item">
                <div>
                  <strong>{data.damage_locations[damage.location] || damage.location} · {data.damage_types[damage.damage_type] || damage.damage_type}</strong>
                  <span>{damage.notes || 'Sem observacoes'}</span>
                </div>
                <span className={`status-badge ${damage.is_resolved ? 'status-available' : 'status-planned'}`}>
                  {damage.is_resolved ? 'Resolvido' : 'Aberto'}
                </span>
              </article>
            )) : <p className="dashboard-empty">Ainda nao ha danos registados nesta secao.</p>}
          </div>
        </div>
      );
    }

    if (currentStep === 10) {
      return (
        <div className="form-stack">
          <label className="form-label" htmlFor="extra-observations">Observacoes finais</label>
          <textarea id="extra-observations" className="text-field text-area-field" value={extraObservations} onChange={(event) => setExtraObservations(event.target.value)} />
          <ImageSourceField
            label="Fotos extra"
            multiple
            galleryAccept=".pdf,image/*"
            galleryLabel="Galeria / ficheiros"
            onFilesSelected={(files) => setFileBucket('extra_photos', files)}
          />
          {renderPhotoThumbs('extra')}
        </div>
      );
    }

    if (currentStep === 11) {
      return (
        <div className="form-stack">
          {isManager ? (
            <>
              <label className="form-label" htmlFor="responsible-name">Nome do responsavel</label>
              <input id="responsible-name" className="text-field" value={responsibleSignatureName} onChange={(event) => setResponsibleSignatureName(event.target.value)} />
              <SignaturePad
                label="Assinatura do responsavel"
                value={responsibleSignatureData}
                onChange={setResponsibleSignatureData}
              />
            </>
          ) : null}
          <label className="form-label" htmlFor="driver-name">Nome do condutor</label>
          <input id="driver-name" className="text-field" value={driverSignatureName} onChange={(event) => setDriverSignatureName(event.target.value)} />
          <SignaturePad
            label="Assinatura do condutor"
            value={driverSignatureData}
            onChange={setDriverSignatureData}
          />
        </div>
      );
    }

    return (
      <div className="form-stack">
        <p>O relatorio final e o PDF ficam disponiveis assim que fechares a inspecao.</p>
        {data.inspection.report_pdf_url ? (
          <a className="receipt-link" href={data.inspection.report_pdf_url} target="_blank" rel="noreferrer">
            Abrir PDF da inspecao
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <IonPage>
      <DriverPageHeader title="Inspecao" subtitle="Workflow de inspeção da viatura" />
      <IonContent fullscreen className="home-page">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="home-shell home-shell-with-tabs">
          <div className="dashboard-actions">
            <IonButton fill="outline" onClick={() => history.push('/dashboard/inspections')}>
              Voltar a lista
            </IonButton>
            {currentStep > 1 && currentStep < 12 ? (
              <IonButton fill="outline" onClick={() => void handleBackStep()} disabled={isSaving}>
                Voltar etapa
              </IonButton>
            ) : null}
          </div>

          {isLoading ? (
            <div className="loading-state">
              <IonSpinner name="crescent" />
            </div>
          ) : null}

          {error ? <p className="status-error">{error}</p> : null}
          {success ? <p className="status-success">{success}</p> : null}

          {!isLoading && data ? (
            <>
              <section className="hero-panel">
                <div className="hero-copy-block">
                  <p className="hero-eyebrow">{data.inspection.type_label}</p>
                  <h1>{data.inspection.vehicle.license_plate || 'Sem matricula'}</h1>
                  <p className="hero-copy">
                    {data.inspection.vehicle.brand || ''} {data.inspection.vehicle.model || ''} · {data.inspection.driver.name || 'Sem driver'}
                  </p>
                  <p className="hero-copy hero-copy-muted">
                    Estado atual: {data.inspection.status_label}. Etapa {currentStep} de {stepEntries.length}.
                  </p>
                </div>
                <div className="hero-side">
                  <div className="role-chip-row">
                    <span className="role-chip">{data.inspection.status_label}</span>
                    <span className="role-chip">Etapa {currentStep}</span>
                  </div>
                  {data.inspection.report_pdf_url ? (
                    <a className="receipt-link" href={data.inspection.report_pdf_url} target="_blank" rel="noreferrer">
                      Abrir PDF
                    </a>
                  ) : null}
                </div>
              </section>

              <section className="dashboard-section">
                <div className="inspection-step-strip">
                  {stepEntries.map((step) => (
                    <div
                      key={step.key}
                      className={`inspection-step-pill ${
                        step.key === currentStep
                          ? 'inspection-step-pill-active'
                          : step.key < currentStep
                            ? 'inspection-step-pill-done'
                            : ''
                      }`}
                    >
                      <strong>{step.key}</strong>
                      {step.key === currentStep ? <span>{step.label}</span> : null}
                    </div>
                  ))}
                </div>
              </section>

              <section className="dashboard-section">
                <article className="dashboard-card">
                  <div className="card-head">
                    <div>
                      <h3>{data.steps[String(currentStep)]}</h3>
                      <p>Guarda progresso intermédio ou conclui a etapa para avançar.</p>
                    </div>
                    <span className="status-pill">{data.inspection.status_label}</span>
                  </div>
                  {renderStepBody()}
                  <div className="dashboard-actions dashboard-actions-top">
                    {currentStep < 12 ? (
                      <>
                        <IonButton fill="outline" onClick={() => void submitStep('save')} disabled={isSaving}>
                          Guardar
                        </IonButton>
                        <IonButton onClick={() => void submitStep('complete')} disabled={isSaving}>
                          Concluir etapa
                        </IonButton>
                      </>
                    ) : (
                      <IonButton onClick={() => void handleCloseInspection()} disabled={isSaving || data.inspection.status === 'closed'}>
                        {data.inspection.status === 'closed' ? 'Inspecao fechada' : 'Fechar e gerar PDF'}
                      </IonButton>
                    )}
                  </div>
                </article>
              </section>
            </>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DriverInspectionDetailPage;
