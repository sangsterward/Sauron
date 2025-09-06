describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.visit('/')
  })

  it('should complete full login flow and redirect to home page', () => {
    // Mock successful login
    cy.intercept('POST', '/api/v1/auth/login/', {
      statusCode: 200,
      body: {
        token: 'test-token',
        user: { 
          id: 1, 
          username: 'admin', 
          email: 'admin@example.com',
          is_superuser: true
        }
      }
    }).as('loginRequest')

    // Mock user info for token validation
    cy.intercept('GET', '/api/v1/auth/user/', {
      statusCode: 200,
      body: {
        id: 1, 
        username: 'admin', 
        email: 'admin@example.com',
        is_superuser: true
      }
    }).as('userInfo')

    // Should see login button initially
    cy.get('[data-testid="login-button"]').should('be.visible')
    cy.get('[data-testid="user-menu-button"]').should('not.exist')

    // Click login button
    cy.get('[data-testid="login-button"]').click()

    // Modal should open
    cy.get('[data-testid="login-modal"]').should('be.visible')
    cy.get('[data-testid="username-input"]').should('be.visible')
    cy.get('[data-testid="password-input"]').should('be.visible')

    // Fill in credentials
    cy.get('[data-testid="username-input"]').type('admin')
    cy.get('[data-testid="password-input"]').type('admin123')

    // Submit form
    cy.get('[data-testid="login-submit-button"]').click()

    // Wait for login request
    cy.wait('@loginRequest')

    // Modal should close
    cy.get('[data-testid="login-modal"]').should('not.exist')

    // Should see user menu instead of login button
    cy.get('[data-testid="login-button"]').should('not.exist')
    cy.get('[data-testid="user-menu-button"]').should('be.visible')
    cy.get('[data-testid="user-menu-button"]').should('contain', 'admin')

    // Should be on home page
    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })

  it('should show logout button after login and allow logout', () => {
    // Login first
    cy.login('admin', 'admin123')

    // Click user menu
    cy.get('[data-testid="user-menu-button"]').click()

    // Should see user dropdown with logout option
    cy.get('[data-testid="user-dropdown"]').should('be.visible')
    cy.get('[data-testid="logout-button"]').should('be.visible')

    // Click logout
    cy.get('[data-testid="logout-button"]').click()

    // Should see login button again
    cy.get('[data-testid="login-button"]').should('be.visible')
    cy.get('[data-testid="user-menu-button"]').should('not.exist')
  })

  it('should handle login errors gracefully', () => {
    // Mock failed login
    cy.intercept('POST', '/api/v1/auth/login/', {
      statusCode: 401,
      body: {
        detail: 'Invalid credentials'
      }
    }).as('failedLogin')

    // Open login modal
    cy.get('[data-testid="login-button"]').click()

    // Fill with invalid credentials
    cy.get('[data-testid="username-input"]').type('invalid')
    cy.get('[data-testid="password-input"]').type('wrong')

    // Submit form
    cy.get('[data-testid="login-submit-button"]').click()

    // Wait for failed request
    cy.wait('@failedLogin')

    // Should show error message
    cy.get('[data-testid="login-error"]').should('be.visible')
    cy.get('[data-testid="login-error"]').should('contain', 'Invalid credentials')

    // Modal should still be open
    cy.get('[data-testid="login-modal"]').should('be.visible')

    // Should still see login button (not logged in)
    cy.get('[data-testid="login-button"]').should('be.visible')
  })

  it('should persist login state across page refresh', () => {
    // Login first
    cy.login('admin', 'admin123')

    // Verify logged in
    cy.get('[data-testid="user-menu-button"]').should('be.visible')

    // Refresh page
    cy.reload()

    // Should still be logged in
    cy.get('[data-testid="user-menu-button"]').should('be.visible')
    cy.get('[data-testid="login-button"]').should('not.exist')
  })

  it('should toggle password visibility', () => {
    // Open login modal
    cy.get('[data-testid="login-button"]').click()

    // Password should be hidden by default
    cy.get('[data-testid="password-input"]').should('have.attr', 'type', 'password')

    // Click toggle button
    cy.get('[data-testid="password-toggle-button"]').click()

    // Password should be visible
    cy.get('[data-testid="password-input"]').should('have.attr', 'type', 'text')

    // Click toggle button again
    cy.get('[data-testid="password-toggle-button"]').click()

    // Password should be hidden again
    cy.get('[data-testid="password-input"]').should('have.attr', 'type', 'password')
  })

  it('should disable submit button when fields are empty', () => {
    // Open login modal
    cy.get('[data-testid="login-button"]').click()

    // Submit button should be disabled
    cy.get('[data-testid="login-submit-button"]').should('be.disabled')

    // Fill username only
    cy.get('[data-testid="username-input"]').type('admin')
    cy.get('[data-testid="login-submit-button"]').should('be.disabled')

    // Fill password
    cy.get('[data-testid="password-input"]').type('admin123')
    cy.get('[data-testid="login-submit-button"]').should('not.be.disabled')
  })
})
