/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with test credentials
       * @example cy.login('admin', 'admin123')
       */
      login(username?: string, password?: string): Chainable<void>
      
      /**
       * Custom command to logout
       * @example cy.logout()
       */
      logout(): Chainable<void>
      
      /**
       * Custom command to check if user is authenticated
       * @example cy.isAuthenticated()
       */
      isAuthenticated(): Chainable<boolean>
    }
  }
}

// Login command
Cypress.Commands.add('login', (username = 'admin', password = 'admin123') => {
  // Intercept login API call
  cy.intercept('POST', '/api/v1/auth/login/', {
    statusCode: 200,
    body: {
      token: 'test-token',
      user: { 
        id: 1, 
        username, 
        email: `${username}@example.com`,
        is_superuser: true
      }
    }
  }).as('loginRequest')

  // Intercept user info API call for token validation
  cy.intercept('GET', '/api/v1/auth/user/', {
    statusCode: 200,
    body: {
      id: 1, 
      username, 
      email: `${username}@example.com`,
      is_superuser: true
    }
  }).as('userInfo')

  // Click login button
  cy.get('[data-testid="login-button"]').click()
  
  // Fill form
  cy.get('[data-testid="username-input"]').type(username)
  cy.get('[data-testid="password-input"]').type(password)
  
  // Submit form
  cy.get('[data-testid="login-submit-button"]').click()
  
  // Wait for login to complete
  cy.wait('@loginRequest')
  
  // Verify user is logged in
  cy.get('[data-testid="user-menu-button"]').should('be.visible')
})

// Logout command
Cypress.Commands.add('logout', () => {
  // Click user menu
  cy.get('[data-testid="user-menu-button"]').click()
  
  // Click logout
  cy.get('[data-testid="logout-button"]').click()
  
  // Verify user is logged out
  cy.get('[data-testid="login-button"]').should('be.visible')
})

// Check authentication status
Cypress.Commands.add('isAuthenticated', () => {
  return cy.get('body').then(($body) => {
    return $body.find('[data-testid="user-menu-button"]').length > 0
  })
})

export {}