import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonPage,
} from '@ionic/react';
import PublicPageHeader from '../components/PublicPageHeader';
import { publicLinks, serviceCards } from '../lib/publicContent';
import './PublicPages.css';

const ServicesPage: React.FC = () => (
  <IonPage>
    <PublicPageHeader title="Servicos" />
    <IonContent fullscreen className="public-page">
      <div className="public-shell">
        <section className="public-section surface-panel intro-panel">
          <p className="section-tag">Servicos</p>
          <h1 className="page-title">Servicos Movvi</h1>
          <p>
            Uma leitura clara dos servicos principais, com o mesmo ritmo visual da home e acesso direto ao site publico quando precisar de detalhe.
          </p>
        </section>

        <section className="public-section">
          <div className="section-heading section-shell">
            <div className="section-heading-copy">
              <p className="section-tag section-tag-inline">Catalogo</p>
              <h2 className="section-title">Escolha o formato que melhor encaixa no seu percurso</h2>
            </div>
          </div>
          <div className="service-grid">
            {serviceCards.map((card) => (
              <IonCard key={card.title} className={`service-card accent-${card.accent}`}>
                <IonCardContent>
                  <p className="service-subtitle">{card.subtitle}</p>
                  <h2>{card.title}</h2>
                  <p>{card.body}</p>
                  <IonButton className="text-link-cta" fill="clear" href={card.href} target="_blank">
                    Abrir no site
                  </IonButton>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        </section>

        <section className="public-section utility-grid">
          <article className="surface-panel mini-panel">
            <p className="section-tag">Acesso rapido</p>
            <h3>Quem somos</h3>
            <p>Conheca melhor a marca, o posicionamento e a forma como a Movvi organiza a sua oferta publica.</p>
            <IonButton className="secondary-cta" fill="outline" href={publicLinks.about} target="_blank">
              Abrir pagina
            </IonButton>
          </article>
          <article className="surface-panel mini-panel">
            <p className="section-tag">Acesso rapido</p>
            <h3>Contactos</h3>
            <p>Use o site publico para consultar contactos, localizacao e canais diretos da equipa.</p>
            <IonButton className="secondary-cta" fill="outline" href={publicLinks.contacts} target="_blank">
              Falar com a Movvi
            </IonButton>
          </article>
        </section>
      </div>
    </IonContent>
  </IonPage>
);

export default ServicesPage;
