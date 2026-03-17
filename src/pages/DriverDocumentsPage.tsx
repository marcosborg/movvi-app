import {
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
import { apiRequest } from '../lib/api';
import { DriverDocumentsResponse } from './driverArea';
import './Home.css';

const DriverDocumentsPage: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<DriverDocumentsResponse | null>(null);
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
      const response = await apiRequest<DriverDocumentsResponse>('/api/v1/mobile/driver/documents', {
        method: 'GET',
        token,
      });
      setData(response);
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

          {!isLoading && !error && data ? (
            <section className="dashboard-section">
              <div className="dashboard-section-heading">
                <div>
                  <p className="hero-eyebrow">Documentacao pessoal</p>
                  <h2>Ficheiros do motorista</h2>
                </div>
              </div>
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
                              <span>{file.url}</span>
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
            </section>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DriverDocumentsPage;
