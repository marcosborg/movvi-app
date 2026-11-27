const account = {
  user: { id: 7, name: 'Motorista Teste', email: 'driver@example.test', roles: ['Motorista'] },
  driver: { id: 10, name: 'Motorista Teste', company: { id: 7, name: 'Movvi' } },
};
const referralPath = '**/api/v1/mobile/driver/referrals';

function visitSignedIn(path: string, roles = account.user.roles) {
  cy.intercept('GET', '**/api/v1/mobile/me', { ...account, user: { ...account.user, roles } });
  cy.intercept('GET', '**/api/v1/mobile/driver/weeks*', { weeks: [] });
  cy.visit(path, { onBeforeLoad(win) { win.localStorage.setItem('movvi.access_token', 'test-token'); } });
}

function openMenu() {
  let opened: Promise<Event>;
  cy.get('ion-menu').then(($menu) => {
    opened = new Promise((resolve) => $menu[0].addEventListener('ionDidOpen', resolve, { once: true }));
  });
  cy.get('ion-menu-button:visible').shadow().find('button').click();
  cy.then(() => opened);
  cy.get('ion-menu').should('have.class', 'show-menu');
}

describe('Correções reportadas pelo Adelmo', () => {
  function setColorScheme(scheme: 'light' | 'dark') {
    cy.then(() => Cypress.automation('remote:debugger:protocol', {
      command: 'Emulation.setEmulatedMedia',
      params: { features: [{ name: 'prefers-color-scheme', value: scheme }] },
    }));
    cy.window().then((win) => expect(win.matchMedia(`(prefers-color-scheme: ${scheme})`).matches).to.be.true);
  }

  it('abre manutenção do menu público com uma sessão ativa e respeita as permissões', () => {
    visitSignedIn('/tabs/account');
    cy.contains('h1', 'Acesso pronto').should('be.visible');
    cy.contains('ion-tab-button:visible', 'Conta').should('be.visible');
    openMenu();
    cy.contains('ion-item', 'A minha conta').should('exist');
    cy.contains('ion-item', 'Carregamentos e desempenho')
      .should('contain.text', 'início de sessão próprio')
      .and('have.attr', 'href', 'https://dashboard.movvi.com.pt/motorista');
    cy.contains('ion-menu ion-item', 'Indique e ganhe').scrollIntoView().should('be.visible');
    cy.contains('ion-item', 'Gestão de frota e manutenção')
      .should('contain.text', '+351 925 120 962')
      .and('have.attr', 'href', 'https://wa.me/351925120962');
    cy.contains('ion-menu ion-item', 'Richard').should('not.exist');
    cy.contains('ion-menu ion-label', 'Manutenção e viaturas').click();
    cy.location('pathname').should('eq', '/dashboard/maintenance');
    cy.get('ion-menu').should('not.have.class', 'show-menu');
    cy.contains('ion-item', 'Ler matrícula').should('be.visible');
    cy.contains('ion-item', 'Contactar apoio de manutenção')
      .should('have.attr', 'href', 'https://dashboard.movvi.com.pt/apoio');
    cy.contains('ion-item', 'Trocas e atribuições de viaturas').should('not.exist');
    cy.get('ion-button[aria-label="Entrar na conta"]:visible').should('not.exist');
  });

  it('volta à manutenção após o login e mantém as opções de gestão', () => {
    cy.intercept('POST', '**/api/login', {
      ...account, user: { ...account.user, roles: ['Admin'] }, access_token: 'test-token',
    });
    cy.intercept('GET', '**/api/v1/mobile/driver/weeks*', { weeks: [] });
    cy.visit('/dashboard/maintenance');
    cy.location('pathname').should('eq', '/login');
    cy.location('search').should('eq', '?returnTo=%2Fdashboard%2Fmaintenance');
    cy.get('.login-page:visible').last().find('.login-form').within(() => {
      cy.get('ion-input input[type=email]').type('driver@example.test');
      cy.get('ion-input input[type=password]').type('test-password');
      cy.root().submit();
    });
    cy.location('pathname').should('eq', '/dashboard/maintenance');
    cy.contains('ion-item', 'Trocas e atribuições de viaturas').should('be.visible');
    cy.contains('ion-item', 'Vistorias').should('be.visible');
  });

  it('agrupa atalhos sem corte num ecrã estreito com letra maior', () => {
    cy.viewport(320, 650);
    visitSignedIn('/dashboard/maintenance', ['Admin']);
    cy.document().then((doc) => { doc.documentElement.style.fontSize = '200%'; });
    cy.get('.driver-tabbar').should(($bar) => {
      const bar = $bar[0].getBoundingClientRect();
      const buttons = $bar.find('ion-tab-button').toArray();
      expect(buttons).to.have.length(4);
      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        expect(rect.left).to.be.at.least(bar.left);
        expect(rect.right).to.be.at.most(bar.right);
        const label = button.querySelector('ion-label')!;
        expect(label.scrollWidth).to.be.at.most(label.clientWidth + 1);
      });
    });
    cy.contains('ion-tab-button', 'Mais').click();
    cy.contains('.driver-action-list ion-item', 'Indique e ganhe').scrollIntoView().should('be.visible');
    cy.contains('ion-item', 'Documentos').should('exist');
  });

  (['light', 'dark'] as const).forEach((scheme) => {
    it(`mantém a barra pública legível em modo ${scheme}`, () => {
      setColorScheme(scheme);
      visitSignedIn('/tabs/account');
      cy.get('ion-tab-bar.public-tabbar').should('have.css', 'background-color', 'rgb(255, 249, 245)');
      cy.contains('ion-tab-button', 'Conta').shadow().find('[part="native"]')
        .should('have.css', 'color', 'rgb(141, 62, 37)');
      cy.contains('ion-tab-button', 'Início').shadow().find('[part="native"]')
        .should('have.css', 'color', 'rgb(87, 61, 49)');
    });

    it(`mantém manutenção e Mais legíveis em modo ${scheme}`, () => {
      setColorScheme(scheme);
      visitSignedIn('/dashboard/maintenance');
      cy.contains('ion-item', 'Contactar apoio de manutenção').shadow().find('[part="native"]')
        .should('have.css', 'color', 'rgb(46, 29, 24)')
        .and('have.css', 'background-color', 'rgb(255, 250, 246)');
      cy.contains('ion-tab-button', 'Mais').click();
      cy.contains('.driver-action-list:visible ion-item', 'Indique e ganhe').shadow().find('[part="native"]')
        .should('have.css', 'color', 'rgb(46, 29, 24)')
        .and('have.css', 'background-color', 'rgb(255, 250, 246)');
    });
  });

  it('mostra o texto no tema escuro e mantém a indicação visível se a atualização falhar', () => {
    const referral = { id: 42, name: 'Contacto Teste', phone: '910000000', status: 'submitted', status_label: 'Recebida', reward_amount: 50 };
    cy.intercept('GET', referralPath, { reward_amount: 50, qualification_days: 30, referrals: [] });
    cy.intercept('POST', referralPath, (request) => {
      expect(request.body).to.deep.equal({ name: referral.name, phone: referral.phone, consent: true });
      request.reply({ statusCode: 201, body: { message: 'Indicação registada.', referral } });
    }).as('saveReferral');
    visitSignedIn('/dashboard/referrals');
    setColorScheme('dark');
    cy.contains('Ainda não enviaste nenhuma indicação.').should('exist');
    cy.intercept('GET', referralPath, { statusCode: 503, body: { message: 'Indisponível' } }).as('refreshReferral');
    cy.get('.referral-form-grid input').first().type(referral.name).should('have.css', 'color', 'rgb(46, 29, 24)');
    cy.get('.referral-form-grid input[type=tel]').type(referral.phone).should('have.css', 'color', 'rgb(46, 29, 24)');
    cy.contains('ion-button', 'Enviar indicação').should('have.attr', 'disabled');
    cy.contains('Confirmo que esta pessoa').click();
    cy.contains('ion-button', 'Enviar indicação').click();
    cy.wait('@saveReferral');
    cy.wait('@refreshReferral');
    cy.contains('Indicação registada.').should('be.visible');
    cy.contains('.referral-list-item strong', 'Contacto Teste').should('have.css', 'color', 'rgb(46, 29, 24)');
    cy.contains('.referral-list-item', 'Recebida').should('exist');
    cy.contains('Não foi possível atualizar a lista').should('exist');
  });
});
