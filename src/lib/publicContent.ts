import { PUBLIC_SITE_URL } from './api';

const baseUrl = PUBLIC_SITE_URL.replace(/\/$/, '');

const toAbsolute = (path: string) => `${baseUrl}${path}`;

export const publicLinks = {
  home: `${baseUrl}/`,
  about: `${baseUrl}/cms/1/quem-somos`,
  stand: `${baseUrl}/stand`,
  rentals: `${baseUrl}/aluguer`,
  tours: `${baseUrl}/transfers-tours`,
  contacts: `${baseUrl}/cms/2/contactos`,
  login: `${baseUrl}/login`,
  news: [
    `${baseUrl}/noticias/3`,
    `${baseUrl}/noticias/2`,
    `${baseUrl}/noticias/1`,
  ],
};

export const brandAssets = {
  logo: toAbsolute('/assets/website/assets/img/logo.png'),
};

export const heroSlides = [
  {
    title: 'Mobilidade Simplificada',
    subtitle: 'Descubra o conforto e a versatilidade das nossas viaturas.',
    image: toAbsolute('/storage/58/6924663a71eff_20251124_1145_Carros-Elétricos-em-Lisboa_simple_compose_01kattrhzrfj5am5te3wqf6hv8.png'),
    cta: 'Ver Servicos',
    href: '/tabs/services',
  },
  {
    title: 'Viagens que inspiram',
    subtitle: 'Do aluguer ao tour, temos a solucao perfeita para si.',
    image: toAbsolute('/storage/59/692466fdabd12_20251124_1146_Jovem-Aguardando-TVDE_simple_compose_01kattv3ysev2b822f2gxvpcd4.png'),
    cta: 'Explorar Noticias',
    href: '/tabs/stories',
  },
  {
    title: 'Movvi em movimento',
    subtitle: 'Uma experiencia publica pensada para descobrir, comparar e reservar.',
    image: toAbsolute('/storage/291/69b5c205436dc_Banner-3.jpg'),
    cta: 'Area Reservada',
    href: '/tabs/account',
  },
];

export const aboutContent = {
  title: 'Sobre a Movvi',
  kicker: 'Ligando pessoas e lugares com inovacao',
  body:
    'Somos apaixonados por mobilidade e tecnologia. A Movvi nasce com a missao de ligar pessoas e lugares atraves de solucoes de transporte modernas e acessiveis. Do aluguer de viaturas aos tours personalizados, procuramos uma experiencia mais clara, mais segura e mais elegante.',
  image: toAbsolute('/storage/302/69b8a560482e4_Sede-1.jpg'),
  ctaLabel: 'Contactar Equipa',
};

export const serviceCards = [
  {
    title: 'Stand',
    subtitle: 'Viaturas prontas para entrega',
    body: 'Escolha entre stock selecionado, com foco em estado geral, transparencia e processo simples.',
    href: publicLinks.stand,
    accent: 'terracotta',
  },
  {
    title: 'Aluguer',
    subtitle: 'Frota flexivel para diferentes ritmos',
    body: 'Solucoes para quem precisa de mobilidade imediata com acompanhamento e suporte continuo.',
    href: publicLinks.rentals,
    accent: 'sand',
  },
  {
    title: 'Transfers & Tours',
    subtitle: 'Experiencias pensadas ao detalhe',
    body: 'Rotas, deslocacoes e programas com uma apresentacao cuidada e foco no conforto.',
    href: publicLinks.tours,
    accent: 'forest',
  },
];

export const newsCards = [
  {
    title: 'Documentacao obrigatoria',
    excerpt: 'Saiba quais os documentos necessarios para circular em Portugal com a sua viatura de forma legal.',
    image: toAbsolute('/storage/75/6928779d3c32c_464-600x400.jpg'),
    href: publicLinks.news[0],
  },
  {
    title: 'Novas tendencias de mobilidade',
    excerpt: 'Descubra como a tecnologia esta a transformar o transporte urbano e quais as tendencias para o futuro.',
    image: toAbsolute('/storage/74/692877834634d_29-600x400.jpg'),
    href: publicLinks.news[1],
  },
  {
    title: 'Movvi no terreno',
    excerpt: 'Conheca as nossas parcerias e iniciativas que promovem uma mobilidade mais sustentavel.',
    image: toAbsolute('/storage/73/6928776a5f4b0_212-600x400.jpg'),
    href: publicLinks.news[2],
  },
];

export const testimonials = [
  {
    name: 'Daniel Inacio',
    quote:
      'A Movvi destaca-se pelo profissionalismo exemplar e total transparencia em cada processo.',
  },
  {
    name: 'Ricardo Sousa',
    quote:
      'Temos sempre viaturas disponiveis em boas condicoes e apoio ao motorista para qualquer situacao.',
  },
  {
    name: 'Mauricio Gomes da Silva',
    quote:
      'Pronto atendimento, apoio continuo e viaturas excelentes tornam a experiencia muito consistente.',
  },
];
