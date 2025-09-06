describe('Dashboard', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('displays the dashboard page', () => {
    cy.contains('Dashboard').should('be.visible')
    cy.contains('Home Hub Monitor').should('be.visible')
  })

  it('shows loading state initially', () => {
    // The dashboard should show a loading spinner initially
    cy.get('[data-cy="loading-spinner"]').should('be.visible')
  })

  it('displays stats cards', () => {
    // Wait for the API call to complete (or mock it)
    cy.intercept('GET', '**/api/v1/services/stats/**', {
      statusCode: 200,
      body: {
        total_services: 10,
        healthy_services: 8,
        unhealthy_services: 2,
        service_types: { docker: 5, http: 3, tcp: 2 },
      },
    }).as('getStats')

    cy.wait('@getStats')

    // Check that stats cards are displayed
    cy.contains('Total Services').should('be.visible')
    cy.contains('Healthy Services').should('be.visible')
    cy.contains('Unhealthy Services').should('be.visible')
    cy.contains('Service Types').should('be.visible')
  })

  it('handles API errors gracefully', () => {
    cy.intercept('GET', '**/api/v1/services/stats/**', {
      statusCode: 500,
      body: { error: 'Internal Server Error' },
    }).as('getStatsError')

    cy.wait('@getStatsError')

    cy.contains('Error loading dashboard data').should('be.visible')
  })
})
