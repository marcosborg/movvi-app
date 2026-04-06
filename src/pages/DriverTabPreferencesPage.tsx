import {
  IonButton,
  IonContent,
  IonPage,
} from '@ionic/react';
import { useMemo, useState } from 'react';
import DriverPageHeader from '../components/DriverPageHeader';
import {
  getVisibleDriverTabs,
  readDriverTabOrder,
  sortDriverTabsByPreference,
  writeDriverTabOrder,
} from '../components/driverTabPreferences';
import { useAuth } from '../auth/AuthContext';
import './Home.css';

const DriverTabPreferencesPage: React.FC = () => {
  const { user, driver } = useAuth();
  const [preferredOrder, setPreferredOrder] = useState<string[]>(() => readDriverTabOrder());

  const context = {
    isAdmin: Boolean(user?.roles.includes('Admin')),
    isGestor: Boolean(user?.roles.includes('Gestor')),
    canViewFinance: Boolean(user?.roles.includes('Admin') || user?.roles.includes('Gestor')),
    hasDriverProfile: Boolean(driver),
  };

  const visibleTabs = useMemo(() => {
    return sortDriverTabsByPreference(getVisibleDriverTabs(context), preferredOrder);
  }, [context.canViewFinance, context.hasDriverProfile, context.isAdmin, context.isGestor, preferredOrder]);

  function persist(nextOrder: string[]) {
    setPreferredOrder(nextOrder);
    writeDriverTabOrder(nextOrder);
  }

  function moveTab(currentIndex: number, direction: -1 | 1) {
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= visibleTabs.length) {
      return;
    }

    const reordered = [...visibleTabs];
    const [selected] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, selected);
    persist(reordered.map((tab) => tab.key));
  }

  function resetOrder() {
    persist(getVisibleDriverTabs(context).map((tab) => tab.key));
  }

  return (
    <IonPage>
      <DriverPageHeader title="Abas" subtitle="Ordenacao personalizada do dashboard" />
      <IonContent fullscreen className="home-page">
        <div className="home-shell home-shell-with-tabs">
          <section className="hero-panel">
            <div className="hero-copy-block">
              <p className="hero-eyebrow">Preferencias</p>
              <h1>Organizar abas</h1>
              <p className="hero-copy">
                Define a ordem das abas visiveis no dashboard. A configuracao fica guardada neste dispositivo.
              </p>
            </div>
            <div className="hero-side">
              <div className="dashboard-actions">
                <IonButton fill="outline" onClick={resetOrder}>
                  Repor ordem base
                </IonButton>
                <IonButton routerLink="/dashboard/overview">
                  Voltar ao resumo
                </IonButton>
              </div>
            </div>
          </section>

          <section className="dashboard-section">
            <article className="dashboard-card">
              <div className="card-head">
                <div>
                  <h3>Abas ativas</h3>
                  <p>Usa os botoes para subir ou descer cada aba.</p>
                </div>
              </div>

              <div className="tab-preference-list">
                {visibleTabs.map((tab, index) => (
                  <div key={tab.key} className="tab-preference-item">
                    <div>
                      <strong>{tab.label}</strong>
                      <span>{tab.href}</span>
                    </div>
                    <div className="dashboard-actions">
                      <IonButton
                        fill="outline"
                        size="small"
                        onClick={() => moveTab(index, -1)}
                        disabled={index === 0}
                      >
                        Subir
                      </IonButton>
                      <IonButton
                        fill="outline"
                        size="small"
                        onClick={() => moveTab(index, 1)}
                        disabled={index === visibleTabs.length - 1}
                      >
                        Descer
                      </IonButton>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DriverTabPreferencesPage;
