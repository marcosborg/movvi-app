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
import DriverWeekPicker from '../components/DriverWeekPicker';
import { useDriverWeek } from '../components/DriverWeekContext';
import DriverPageHeader from '../components/DriverPageHeader';
import ImageSourceField from '../components/ImageSourceField';
import { apiRequest } from '../lib/api';
import { DriverReceiptMutationResponse, DriverReceiptsResponse, formatMoney } from './driverArea';
import './Home.css';

const DriverReceiptsPage: React.FC = () => {
  const { token } = useAuth();
  const { selectedWeek } = useDriverWeek();
  const [data, setData] = useState<DriverReceiptsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [expenseFiles, setExpenseFiles] = useState<File[]>([]);
  const [expenseValue, setExpenseValue] = useState('');
  const [reimbursementFile, setReimbursementFile] = useState<File | null>(null);
  const [reimbursementValue, setReimbursementValue] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);

  useEffect(() => {
    void loadReceipts();
  }, [token, selectedWeek]);

  async function loadReceipts() {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const query = selectedWeek ? `?date=${encodeURIComponent(selectedWeek)}` : '';
      const response = await apiRequest<DriverReceiptsResponse>(`/api/v1/mobile/driver/receipts${query}`, {
        method: 'GET',
        token,
      });
      setData(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar os recibos.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    await loadReceipts();
    event.detail.complete();
  }

  function resetSubmissionState() {
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  async function handleReceiptSubmit() {
    if (!token || !selectedWeek || !receiptFile) {
      return;
    }

    resetSubmissionState();
    setSubmittingKey('receipt');

    try {
      const body = new FormData();
      body.append('date', selectedWeek);
      body.append('file', receiptFile);

      const response = await apiRequest<DriverReceiptMutationResponse>('/api/v1/mobile/driver/receipts', {
        method: 'POST',
        token,
        body,
      });

      setReceiptFile(null);
      setSubmitSuccess(response.message);
      await loadReceipts();
    } catch (submissionError) {
      setSubmitError(submissionError instanceof Error ? submissionError.message : 'Nao foi possivel enviar o recibo.');
    } finally {
      setSubmittingKey(null);
    }
  }

  async function handleExpenseSubmit() {
    if (!token || !selectedWeek || expenseFiles.length === 0) {
      return;
    }

    resetSubmissionState();
    setSubmittingKey('expense');

    try {
      const body = new FormData();
      body.append('date', selectedWeek);
      body.append('approved_value', expenseValue || '0');
      expenseFiles.forEach((file) => body.append('files[]', file));

      const response = await apiRequest<DriverReceiptMutationResponse>('/api/v1/mobile/driver/expense-receipts', {
        method: 'POST',
        token,
        body,
      });

      setExpenseFiles([]);
      setExpenseValue('');
      setSubmitSuccess(response.message);
      await loadReceipts();
    } catch (submissionError) {
      setSubmitError(submissionError instanceof Error ? submissionError.message : 'Nao foi possivel enviar os recibos de despesa.');
    } finally {
      setSubmittingKey(null);
    }
  }

  async function handleReimbursementSubmit() {
    if (!token || !selectedWeek || !reimbursementFile) {
      return;
    }

    resetSubmissionState();
    setSubmittingKey('reimbursement');

    try {
      const body = new FormData();
      body.append('date', selectedWeek);
      body.append('value', reimbursementValue || '0');
      body.append('file', reimbursementFile);

      const response = await apiRequest<DriverReceiptMutationResponse>('/api/v1/mobile/driver/reimbursements', {
        method: 'POST',
        token,
        body,
      });

      setReimbursementFile(null);
      setReimbursementValue('');
      setSubmitSuccess(response.message);
      await loadReceipts();
    } catch (submissionError) {
      setSubmitError(submissionError instanceof Error ? submissionError.message : 'Nao foi possivel gravar a devolucao.');
    } finally {
      setSubmittingKey(null);
    }
  }

  return (
    <IonPage>
      <DriverPageHeader title="Recibos" />
      <IonContent fullscreen className="home-page">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="home-shell home-shell-with-tabs">
          <DriverWeekPicker />
          {isLoading ? (
            <div className="loading-state">
              <IonSpinner name="crescent" />
            </div>
          ) : null}

          {error ? <p className="status-error">{error}</p> : null}
          {submitError ? <p className="status-error">{submitError}</p> : null}
          {submitSuccess ? <p className="status-success">{submitSuccess}</p> : null}

          {!isLoading && !error && data ? (
            <>
              <section className="dashboard-section">
                <div className="dashboard-section-heading">
                  <div>
                    <p className="hero-eyebrow">Submissao</p>
                    <h2>Enviar ficheiros da semana</h2>
                  </div>
                </div>
                <div className="dashboard-card-grid">
                  <article className="dashboard-card">
                    <div className="card-head">
                      <div>
                        <h3>Recibo verde</h3>
                        <p>O valor acompanha automaticamente o saldo da semana selecionada.</p>
                      </div>
                      <span className={`status-badge ${data.submission.can_submit_receipt ? 'status-available' : 'status-locked'}`}>
                        {data.submission.can_submit_receipt ? 'Disponivel' : 'Bloqueado'}
                      </span>
                    </div>
                    <div className="submission-meta">
                      <span>Saldo atual: {formatMoney(data.submission.balance?.new_balance)}</span>
                      <span>Valor final: {formatMoney(data.submission.balance?.final)}</span>
                    </div>
                    <div className="form-stack">
                      <ImageSourceField
                        label="Ficheiro do recibo"
                        galleryAccept=".pdf,image/*"
                        galleryLabel="Galeria / ficheiros"
                        onFilesSelected={(files) => setReceiptFile(files?.[0] ?? null)}
                      />
                      {receiptFile ? <p className="file-chip">{receiptFile.name}</p> : null}
                      <IonButton
                        expand="block"
                        onClick={() => void handleReceiptSubmit()}
                        disabled={!data.submission.can_submit_receipt || !receiptFile || submittingKey !== null}
                      >
                        {submittingKey === 'receipt' ? 'A enviar...' : 'Enviar recibo verde'}
                      </IonButton>
                    </div>
                  </article>

                  <article className="dashboard-card">
                    <div className="card-head">
                      <div>
                        <h3>Recibos de despesa</h3>
                        <p>Se ja existir um registo nesta semana, a app atualiza-o e acrescenta novos ficheiros.</p>
                      </div>
                      <span className={`status-badge ${data.submission.expense_receipt?.verified ? 'status-locked' : 'status-available'}`}>
                        {data.submission.expense_receipt?.verified ? 'Validado' : 'Editavel'}
                      </span>
                    </div>
                    <div className="form-stack">
                      <label className="form-label" htmlFor="expense-value">Somatorio das despesas</label>
                      <input
                        id="expense-value"
                        className="text-field"
                        inputMode="decimal"
                        type="number"
                        min="0"
                        step="0.01"
                        value={expenseValue}
                        onChange={(event) => setExpenseValue(event.target.value)}
                        placeholder="0,00"
                        disabled={Boolean(data.submission.expense_receipt?.verified)}
                      />
                      <ImageSourceField
                        label="Ficheiros de despesa"
                        multiple
                        disabled={Boolean(data.submission.expense_receipt?.verified)}
                        galleryAccept=".pdf,image/*"
                        galleryLabel="Galeria / ficheiros"
                        onFilesSelected={(files) => setExpenseFiles(Array.from(files ?? []))}
                      />
                      {expenseFiles.length > 0 ? (
                        <div className="file-chip-list">
                          {expenseFiles.map((file) => (
                            <p key={`${file.name}-${file.size}`} className="file-chip">{file.name}</p>
                          ))}
                        </div>
                      ) : null}
                      <IonButton
                        expand="block"
                        fill="outline"
                        onClick={() => void handleExpenseSubmit()}
                        disabled={Boolean(data.submission.expense_receipt?.verified) || expenseFiles.length === 0 || submittingKey !== null}
                      >
                        {submittingKey === 'expense' ? 'A enviar...' : 'Enviar recibos de despesa'}
                      </IonButton>
                    </div>
                  </article>

                  <article className="dashboard-card">
                    <div className="card-head">
                      <div>
                        <h3>Devolucao de valores</h3>
                        <p>Submete o comprovativo da devolucao com valor opcional.</p>
                      </div>
                    </div>
                    <div className="form-stack">
                      <label className="form-label" htmlFor="reimbursement-value">Valor devolvido</label>
                      <input
                        id="reimbursement-value"
                        className="text-field"
                        inputMode="decimal"
                        type="number"
                        min="0"
                        step="0.01"
                        value={reimbursementValue}
                        onChange={(event) => setReimbursementValue(event.target.value)}
                        placeholder="0,00"
                      />
                      <ImageSourceField
                        label="Comprovativo"
                        galleryAccept=".pdf,image/*"
                        galleryLabel="Galeria / ficheiros"
                        onFilesSelected={(files) => setReimbursementFile(files?.[0] ?? null)}
                      />
                      {reimbursementFile ? <p className="file-chip">{reimbursementFile.name}</p> : null}
                      <IonButton
                        expand="block"
                        color="danger"
                        onClick={() => void handleReimbursementSubmit()}
                        disabled={!reimbursementFile || submittingKey !== null}
                      >
                        {submittingKey === 'reimbursement' ? 'A enviar...' : 'Gravar devolucao'}
                      </IonButton>
                    </div>
                  </article>
                </div>
              </section>

              <section className="dashboard-section">
                <div className="dashboard-section-heading">
                  <div>
                    <p className="hero-eyebrow">Recibos verdes</p>
                    <h2>Historico do motorista</h2>
                  </div>
                </div>
                <div className="dashboard-card-grid dashboard-card-grid-single">
                  <article className="dashboard-card">
                    <div className="receipt-list">
                      {data.receipts.length > 0 ? (
                        data.receipts.map((receipt) => (
                          <div key={receipt.id} className="receipt-item action-item">
                            <div>
                              <strong>{formatMoney(receipt.value)}</strong>
                              <span>{receipt.created_at || 'Sem data'}</span>
                              <span>Valor validado: {formatMoney(receipt.verified_value)}</span>
                            </div>
                            <div className="receipt-meta">
                              <span className={`status-badge ${receipt.paid ? 'status-available' : 'status-planned'}`}>
                                {receipt.paid ? 'Pago' : receipt.verified ? 'Validado' : 'Pendente'}
                              </span>
                            </div>
                            {receipt.file_url ? (
                              <a className="receipt-link" href={receipt.file_url} target="_blank" rel="noreferrer">
                                Ver ficheiro
                              </a>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <p className="dashboard-empty">Ainda nao existem recibos verdes submetidos.</p>
                      )}
                    </div>
                  </article>
                </div>
              </section>

              <section className="dashboard-section">
                <div className="dashboard-section-heading">
                  <div>
                    <p className="hero-eyebrow">Despesas</p>
                    <h2>Recibos de despesa</h2>
                  </div>
                </div>
                <div className="dashboard-card-grid">
                  <article className="dashboard-card">
                    <div className="receipt-list">
                      {data.expense_receipts.length > 0 ? (
                        data.expense_receipts.map((expenseReceipt) => (
                          <div key={expenseReceipt.id} className="receipt-item action-item">
                            <div>
                              <strong>{formatMoney(expenseReceipt.approved_value)}</strong>
                              <span>{expenseReceipt.created_at || 'Sem data'}</span>
                              <span>Ficheiros: {expenseReceipt.files.length}</span>
                            </div>
                            <div className="receipt-meta-col">
                              <span className={`status-badge ${expenseReceipt.verified ? 'status-available' : 'status-planned'}`}>
                                {expenseReceipt.verified ? 'Validado' : 'Pendente'}
                              </span>
                              {expenseReceipt.files[0] ? (
                                <a className="receipt-link" href={expenseReceipt.files[0].url} target="_blank" rel="noreferrer">
                                  Ver ficheiros
                                </a>
                              ) : null}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="dashboard-empty">Sem recibos de despesa registados.</p>
                      )}
                    </div>
                  </article>

                  <article className="dashboard-card">
                    <div className="card-head">
                      <h3>Devolucao de valores</h3>
                    </div>
                    <div className="receipt-list">
                      {data.reimbursements.length > 0 ? (
                        data.reimbursements.map((reimbursement) => (
                          <div key={reimbursement.id} className="receipt-item action-item">
                            <div>
                              <strong>{formatMoney(reimbursement.value)}</strong>
                              <span>{reimbursement.created_at || 'Sem data'}</span>
                            </div>
                            <div className="receipt-meta-col">
                              <span className={`status-badge ${reimbursement.verified ? 'status-available' : 'status-planned'}`}>
                                {reimbursement.verified ? 'Validado' : 'Submetido'}
                              </span>
                              {reimbursement.file_url ? (
                                <a className="receipt-link" href={reimbursement.file_url} target="_blank" rel="noreferrer">
                                  Ver ficheiro
                                </a>
                              ) : null}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="dashboard-empty">Sem devolucoes registadas.</p>
                      )}
                    </div>
                  </article>
                </div>
              </section>
            </>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DriverReceiptsPage;
