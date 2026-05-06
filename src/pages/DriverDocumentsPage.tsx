import {
  IonContent,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
} from '@ionic/react';
import type { RefresherEventDetail } from '@ionic/core';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import DriverPageHeader from '../components/DriverPageHeader';
import { apiRequest } from '../lib/api';
import { CompanyDocumentsResponse, DriverDocumentsResponse } from './driverArea';
import './Home.css';

type DocumentTab = 'driver' | 'company';

const DriverDocumentsPage: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<DriverDocumentsResponse | null>(null);
  const [companyData, setCompanyData] = useState<CompanyDocumentsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<DocumentTab>('driver');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadDocuments();
  }, [token]);

  async function loadDocuments() {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [driverDocuments, companyDocuments] = await Promise.all([
        apiRequest<DriverDocumentsResponse>('/api/v1/mobile/driver/documents', {
          method: 'GET',
          token,
        }),
        apiRequest<CompanyDocumentsResponse>('/api/v1/mobile/company-documents', {
          method: 'GET',
          token,
        }),
      ]);
      setData(driverDocuments);
      setCompanyData(companyDocuments);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar os documentos.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    await loadDocuments();
    event.detail.complete();
  }

  return (
    <IonPage>
      <DriverPageHeader title="Documentos" />
      <IonContent fullscreen className="home-page">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="home-shell home-shell-with-tabs">
          {isLoading ? (
            <div className="loading-state">
              <IonSpinner name="crescent" />
            </div>
          ) : null}

          {error ? <p className="status-error">{error}</p> : null}

          {!isLoading && !error && data && companyData ? (
            <section className="dashboard-section">
              <IonSegment
                className="document-tabs"
                value={activeTab}
                onIonChange={(event) => setActiveTab((event.detail.value as DocumentTab) ?? 'driver')}
              >
                <IonSegmentButton value="driver">
                  Documentos do motorista
                </IonSegmentButton>
                <IonSegmentButton value="company">
                  Documentos da empresa
                </IonSegmentButton>
              </IonSegment>

              <div className="dashboard-section-heading">
                <div>
                  <p className="hero-eyebrow">
                    {activeTab === 'driver' ? 'Documentacao pessoal' : 'Documentacao da empresa'}
                  </p>
                  <h2>{activeTab === 'driver' ? 'Ficheiros do motorista' : 'Ficheiros da empresa'}</h2>
                </div>
              </div>

              {activeTab === 'driver' ? (
                <div className="dashboard-card-grid">
                  {data.documents.map((document) => (
                    <article key={document.key} className="dashboard-card">
                      <div className="card-head">
                        <h3>{document.title}</h3>
                        <span className="status-pill">{document.files.length}</span>
                      </div>
                      {document.files.length > 0 ? (
                        <div className="receipt-list">
                          {document.files.map((file) => (
                            <div key={`${document.key}-${file.name}`} className="receipt-item action-item">
                              <div>
                                <strong>{file.name}</strong>
                                <a className="receipt-link" href={file.url} target="_blank" rel="noreferrer">
                                  Abrir ficheiro
                                </a>
                              </div>
                              <span className="status-badge status-available">Disponivel</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="dashboard-empty">Sem ficheiros enviados nesta categoria.</p>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="dashboard-card-grid">
                  {companyData.documents.length > 0 ? (
                    companyData.documents.map((document) => (
                      <article key={document.id} className="dashboard-card">
                        <div className="card-head">
                          <h3>{document.name || 'Documento da empresa'}</h3>
                          <span className="status-pill">{document.files.length}</span>
                        </div>
                        {document.files.length > 0 ? (
                          <div className="receipt-list">
                            {document.files.map((file) => (
                              <div key={`${document.id}-${file.name}`} className="receipt-item action-item">
                                <div>
                                  <strong>{file.name}</strong>
                                  <a className="receipt-link" href={file.url} target="_blank" rel="noreferrer">
                                    Abrir ficheiro
                                  </a>
                                </div>
                                <span className="status-badge status-available">Disponivel</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="dashboard-empty">Sem ficheiros associados.</p>
                        )}
                      </article>
                    ))
                  ) : (
                    <article className="dashboard-card">
                      <p className="dashboard-empty">Sem documentos da empresa disponíveis.</p>
                    </article>
                  )}
                </div>
              )}
            </section>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DriverDocumentsPage;
