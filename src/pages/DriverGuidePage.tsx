import {
  IonButton,
  IonContent,
  IonPage,
} from '@ionic/react';
import DriverPageHeader from '../components/DriverPageHeader';
import './Home.css';

const driverGuideSections = [
  {
    title: 'Arranque rapido',
    points: [
      'Entrar na conta e confirmar a semana ativa no topo do dashboard.',
      'Consultar o Resumo para ver saldo, estado semanal e viatura atribuida.',
      'Ir a Extrato para validar valores da semana e categorias financeiras.',
    ],
  },
  {
    title: 'Recibos e comprovativos',
    points: [
      'Submeter o recibo semanal na area Recibos.',
      'Anexar despesas e devolucoes apenas com ficheiros legiveis.',
      'Confirmar depois se o estado ficou pendente, validado ou pago.',
    ],
  },
  {
    title: 'Inspecoes e viatura',
    points: [
      'Usar Inspecoes para criar uma inspecao completa ou simplificada.',
      'Na avaliacao semanal, preencher quilometragem, pneus, oleo e combustivel.',
      'Se existirem avisos no painel, descrever e anexar foto do painel.',
    ],
  },
  {
    title: 'Financeiro',
    points: [
      'No extrato, IVA e Percentagem aparecem separados.',
      'Caucao recebida e caucao devolvida aparecem em linhas proprias.',
      'Abatimento de aluguer e diferenca de faturacao minima afetam o calculo semanal.',
    ],
  },
  {
    title: 'Operacao de gestor/admin',
    points: [
      'Em Relatorios, usar os filtros por semana, viatura e motorista para validar fechos.',
      'No company report, verificar o duplo check entre valor recebido e Uber/Bolt.',
      'Em Passagens, usar Mostrar tudo apenas quando precisares de pesquisar ocupados.',
    ],
  },
  {
    title: 'Personalizacao',
    points: [
      'Em Abas, ordenar os atalhos do dashboard conforme uso mais frequente.',
      'A ordem fica guardada neste dispositivo.',
      'Se for preciso, usar Repor ordem base para voltar ao layout original.',
    ],
  },
  {
    title: 'Quando pedir apoio',
    points: [
      'Se os valores da semana nao baterem certo com o extrato.',
      'Se uma viatura ou motorista nao aparecer quando devia.',
      'Se uma avaliacao semanal ou inspecao ficar bloqueada por validacao.',
    ],
  },
];

const DriverGuidePage: React.FC = () => {
  return (
    <IonPage>
      <DriverPageHeader title="Guia" subtitle="Guia de utilizacao da app e operacao semanal" />
      <IonContent fullscreen className="home-page">
        <div className="home-shell home-shell-with-tabs">
          <section className="hero-panel">
            <div className="hero-copy-block">
              <p className="hero-eyebrow">Ajuda</p>
              <h1>Guia de utilizacao</h1>
              <p className="hero-copy">
                Este guia resume os fluxos principais da app para motorista, gestor e administracao operacional.
              </p>
            </div>
            <div className="hero-side">
              <div className="dashboard-actions">
                <IonButton routerLink="/dashboard/overview">
                  Voltar ao resumo
                </IonButton>
                <IonButton fill="outline" routerLink="/dashboard/preferences">
                  Ordenar abas
                </IonButton>
              </div>
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-card-grid">
              {driverGuideSections.map((section) => (
                <article key={section.title} className="dashboard-card">
                  <div className="card-head">
                    <h3>{section.title}</h3>
                  </div>
                  <div className="guide-list">
                    {section.points.map((point) => (
                      <p key={point} className="guide-point">{point}</p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DriverGuidePage;
