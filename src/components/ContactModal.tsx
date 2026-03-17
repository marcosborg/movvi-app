import { FormEvent, useState } from 'react';
import {
  IonButton,
  IonCheckbox,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonTextarea,
  IonText,
} from '@ionic/react';
import { apiRequest } from '../lib/api';

type ContactModalProps = {
  isOpen: boolean;
  onDismiss: () => void;
};

const initialState = {
  name: '',
  phone: '',
  email: '',
  message: '',
  rgpd: false,
};

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onDismiss }) => {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await apiRequest<{ message: string }>('/api/v1/public/contact', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      setSuccess(response.message);
      setForm(initialState);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Nao foi possivel enviar a mensagem.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function closeModal() {
    setError(null);
    setSuccess(null);
    onDismiss();
  }

  return (
    <IonModal isOpen={isOpen} onDidDismiss={closeModal} initialBreakpoint={0.95} breakpoints={[0, 0.95]}>
      <div className="contact-modal-shell">
        <div className="contact-modal-header">
          <div>
            <p className="section-tag">Contacto</p>
            <h2>Falar com a equipa</h2>
            <IonNote>Resposta orientada para aluguer, stand, tours ou pedidos gerais.</IonNote>
          </div>
          <IonButton fill="clear" onClick={closeModal}>
            Fechar
          </IonButton>
        </div>

        <form onSubmit={handleSubmit} className="contact-form">
          <IonList lines="none">
            <IonItem className="contact-field">
              <IonLabel className="contact-field-label" position="stacked">Nome</IonLabel>
              <IonInput
                className="contact-input"
                placeholder="O seu nome"
                value={form.name}
                onIonInput={(event) => setForm((current) => ({ ...current, name: event.detail.value ?? '' }))}
                required
              />
            </IonItem>
            <IonItem className="contact-field">
              <IonLabel className="contact-field-label" position="stacked">Telefone</IonLabel>
              <IonInput
                className="contact-input"
                placeholder="912 345 678"
                value={form.phone}
                onIonInput={(event) => setForm((current) => ({ ...current, phone: event.detail.value ?? '' }))}
                required
              />
            </IonItem>
            <IonItem className="contact-field">
              <IonLabel className="contact-field-label" position="stacked">Email</IonLabel>
              <IonInput
                className="contact-input"
                type="email"
                placeholder="nome@email.com"
                value={form.email}
                onIonInput={(event) => setForm((current) => ({ ...current, email: event.detail.value ?? '' }))}
                required
              />
            </IonItem>
            <IonItem className="contact-field">
              <IonLabel className="contact-field-label" position="stacked">Mensagem</IonLabel>
              <IonTextarea
                className="contact-input"
                placeholder="Diga-nos como podemos ajudar."
                value={form.message}
                autoGrow={true}
                rows={5}
                onIonInput={(event) => setForm((current) => ({ ...current, message: event.detail.value ?? '' }))}
              />
            </IonItem>
            <IonItem className="contact-checkbox">
              <IonCheckbox
                checked={form.rgpd}
                onIonChange={(event) => setForm((current) => ({ ...current, rgpd: event.detail.checked }))}
              />
              <IonLabel className="contact-checkbox-label">Aceito o tratamento dos dados para contacto.</IonLabel>
            </IonItem>
          </IonList>

          {error ? (
            <IonText color="danger">
              <p className="contact-feedback">{error}</p>
            </IonText>
          ) : null}

          {success ? (
            <IonText color="success">
              <p className="contact-feedback">{success}</p>
            </IonText>
          ) : null}

          <div className="contact-actions">
            <IonButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'A enviar...' : 'Enviar pedido'}
            </IonButton>
          </div>
        </form>
      </div>
    </IonModal>
  );
};

export default ContactModal;
