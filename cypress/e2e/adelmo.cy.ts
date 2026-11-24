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
  it('abre manutenção do menu público com uma sessão ativa e respeita as permissões', () => {
    visitSignedIn('/tabs/account');
    cy.contains('h1', 'Acesso pronto').should('be.visible');
    cy.contains('ion-tab-button:visible', 'Conta').should('be.visible');
    openMenu();
    cy.contains('ion-item', 'A minha conta').should('exist');
    cy.contains('ion-item', 'Carregamentos e desempenho')
      .should('contain.text', 'início de sessão próprio')
      .and('have.attr', 'href', 'https://dashboard.movvi.com.pt/motorista');
    cy.contains('ion-menu ion-label', 'Manutenção e viaturas').click();
    cy.location('pathname').should('eq', '/dashboard/maintenance');
    cy.get('ion-menu').should('not.have.class', 'show-menu');
    cy.contains('ion-item', 'Ler matrícula').should('be.visible');
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
    cy.contains('ion-item', 'Indique').should('be.visible');
    cy.contains('ion-item', 'Documentos').should('exist');
  });

  it('mostra o texto no tema escuro e mantém a indicação visível se a atualização falhar', () => {
    const referral = { id: 42, name: 'Contacto Teste', phone: '910000000', status: 'submitted', status_label: 'Recebida', reward_amount: 50 };
    cy.intercept('GET', referralPath, { reward_amount: 50, qualification_days: 30, referrals: [] });
    cy.intercept('POST', referralPath, (request) => {
      expect(request.body).to.deep.equal({ name: referral.name, phone: referral.phone, consent: true });
      request.reply({ statusCode: 201, body: { message: 'Indicação registada.', referral } });
    }).as('saveReferral');
    visitSignedIn('/dashboard/referrals');
    cy.then(() => Cypress.automation('remote:debugger:protocol', {
        command: 'Emulation.setEmulatedMedia',
        params: { features: [{ name: 'prefers-color-scheme', value: 'dark' }] },
    }));
    cy.window().then((win) => expect(win.matchMedia('(prefers-color-scheme: dark)').matches).to.be.true);
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
    cy.contains('.referral-list-item', 'Contacto Teste').should('exist');
    cy.contains('Não foi possível atualizar a lista').should('exist');
  });
});
