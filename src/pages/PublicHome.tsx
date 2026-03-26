import { useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonPage,
} from '@ionic/react';
import PublicPageHeader from '../components/PublicPageHeader';
import ContactModal from '../components/ContactModal';
import { aboutContent, heroSlides, serviceCards, testimonials } from '../lib/publicContent';
import './PublicPages.css';

const PublicHome: React.FC = () => {
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <IonPage>
      <PublicPageHeader title="Movvi" />
      <IonContent fullscreen className="public-page">
        <div className="public-shell">
          <section className="hero-stack">
            {heroSlides.map((slide) => (
              <article key={slide.title} className="hero-card">
                <img src={slide.image} alt={slide.title} />
                <div className="hero-overlay">
                  <p className="hero-kicker">Mobilidade a sua medida</p>
                  <h1>{slide.title}</h1>
                  <p>{slide.subtitle}</p>
                  <IonButton routerLink={slide.href}>{slide.cta}</IonButton>
                </div>
              </article>
            ))}
        </section>

        <section className="public-section surface-panel about-panel">
          <div>
            <p className="section-tag">Quem somos</p>
            <h2>{aboutContent.title}</h2>
            <h3>{aboutContent.kicker}</h3>
            <p>{aboutContent.body}</p>
            <IonButton className="secondary-cta" fill="outline" onClick={() => setIsContactOpen(true)}>
              {aboutContent.ctaLabel}
            </IonButton>
          </div>
          <img src={aboutContent.image} alt={aboutContent.title} />
        </section>

        <section className="public-section">
          <div className="section-heading section-shell">
            <div className="section-heading-copy">
              <p className="section-tag section-tag-inline">Servicos</p>
              <h2 className="section-title">Escolha o servico certo para o seu percurso</h2>
            </div>
            <IonButton className="text-link-cta" fill="clear" routerLink="/tabs/services">
              Ver tudo
            </IonButton>
          </div>
          <div className="service-grid">
              {serviceCards.map((card) => (
                <IonCard key={card.title} className={`service-card accent-${card.accent}`}>
                  <IonCardContent>
                    <p className="service-subtitle">{card.subtitle}</p>
                    <h3>{card.title}</h3>
                    <p>{card.body}</p>
                    <IonButton className="text-link-cta" fill="clear" href={card.href} target="_blank">
                      Abrir pagina
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              ))}
          </div>
        </section>

          <section className="public-section testimonial-strip">
          <div className="section-heading section-shell">
            <div className="section-heading-copy">
              <p className="section-tag">Confianca</p>
              <h2 className="section-title">O que a experiencia Movvi transmite</h2>
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
      <ContactModal isOpen={isContactOpen} onDismiss={() => setIsContactOpen(false)} />
    </IonPage>
  );
};

export default PublicHome;
