describe('Navigation', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('navigates between pages', () => {
    // Test navigation to Services page
    cy.contains('Services').click()
    cy.url().should('include', '/services')
    cy.contains('Services page coming soon').should('be.visible')

    // Test navigation to Monitoring page
    cy.contains('Monitoring').click()
    cy.url().should('include', '/monitoring')
    cy.contains('Monitoring page coming soon').should('be.visible')

    // Test navigation to Alerts page
    cy.contains('Alerts').click()
    cy.url().should('include', '/alerts')
    cy.contains('Alerts page coming soon').should('be.visible')

    // Test navigation to Docker page
    cy.contains('Docker').click()
    cy.url().should('include', '/docker')
    cy.contains('Docker page coming soon').should('be.visible')

    // Test navigation to Settings page
    cy.contains('Settings').click()
    cy.url().should('include', '/settings')
    cy.contains('Settings page coming soon').should('be.visible')

    // Test navigation back to Dashboard
    cy.contains('Dashboard').click()
    cy.url().should('eq', Cypress.config().baseUrl + '/')
    cy.contains('Dashboard').should('be.visible')
  })

  it('highlights active navigation item', () => {
    // Dashboard should be active by default
    cy.get('[data-cy="nav-dashboard"]').should('have.class', 'bg-primary-50')

    // Click on Services
    cy.contains('Services').click()
    cy.get('[data-cy="nav-services"]').should('have.class', 'bg-primary-50')
  })

  it('displays header on all pages', () => {
    const pages = ['/', '/services', '/monitoring', '/alerts', '/docker', '/settings']
    
    pages.forEach((page) => {
      cy.visit(page)
      cy.contains('Home Hub Monitor').should('be.visible')
      cy.get('header').should('be.visible')
    })
  })
})
