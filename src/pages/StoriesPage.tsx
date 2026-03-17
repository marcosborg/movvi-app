import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonPage,
} from '@ionic/react';
import PublicPageHeader from '../components/PublicPageHeader';
import { newsCards, testimonials } from '../lib/publicContent';
import './PublicPages.css';

const StoriesPage: React.FC = () => (
  <IonPage>
    <PublicPageHeader title="Noticias" />
    <IonContent fullscreen className="public-page">
      <div className="public-shell">
        <section className="public-section surface-panel intro-panel">
          <p className="section-tag">Noticias</p>
          <h1 className="page-title">Noticias e prova social</h1>
          <p>
            Noticias e testemunhos organizados com a mesma leitura da home, para reforcar contexto, credibilidade e continuidade visual.
          </p>
        </section>

        <section className="public-section">
          <div className="section-heading section-shell">
            <div className="section-heading-copy">
              <p className="section-tag section-tag-inline">Noticias</p>
              <h2 className="section-title">Destaques recentes da marca e da mobilidade</h2>
            </div>
          </div>
          <div className="story-grid">
            {newsCards.map((card) => (
              <IonCard key={card.title} className="story-card">
                <img src={card.image} alt={card.title} />
                <IonCardContent>
                  <h2>{card.title}</h2>
                  <p>{card.excerpt}</p>
                  <IonButton className="text-link-cta" fill="clear" href={card.href} target="_blank">
                    Ler no site
                  </IonButton>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        </section>

        <section className="public-section testimonial-strip">
          <div className="section-heading section-shell">
            <div className="section-heading-copy">
              <p className="section-tag section-tag-inline">Testemunhos</p>
              <h2 className="section-title">Confianca construida no terreno</h2>
            </div>
          </div>
          <div className="quote-row">
            {testimonials.map((item) => (
              <blockquote key={item.name} className="quote-card">
                <p>{item.quote}</p>
                <footer>{item.name}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      </div>
    </IonContent>
  </IonPage>
);

export default StoriesPage;
