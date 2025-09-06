describe('Login Flow E2E Tests', () => {
  beforeEach(() => {
    // Clear any existing auth state
    cy.clearLocalStorage()
    cy.clearCookies()
    
    // Visit the home page
    cy.visit('/')
  })

  it('should show login button when not authenticated', () => {
    // Should see the login button in header
    cy.get('[data-testid="login-button"]').should('be.visible')
    cy.get('[data-testid="login-button"]').should('contain', 'Login')
    
    // Should not see user menu
    cy.get('[data-testid="user-menu"]').should('not.exist')
  })

  it('should open login modal when login button is clicked', () => {
    // Click login button
    cy.get('[data-testid="login-button"]').click()
    
    // Modal should be visible
    cy.get('[data-testid="login-modal"]').should('be.visible')
    cy.get('[data-testid="login-modal"]').should('contain', 'Login')
    
    // Form elements should be present
    cy.get('[data-testid="username-input"]').should('be.visible')
    cy.get('[data-testid="password-input"]').should('be.visible')
    cy.get('[data-testid="login-submit-button"]').should('be.visible')
    cy.get('[data-testid="login-cancel-button"]').should('be.visible')
  })

  it('should close login modal when cancel button is clicked', () => {
    // Open modal
    cy.get('[data-testid="login-button"]').click()
    cy.get('[data-testid="login-modal"]').should('be.visible')
    
    // Click cancel
    cy.get('[data-testid="login-cancel-button"]').click()
    
    // Modal should be closed
    cy.get('[data-testid="login-modal"]').should('not.exist')
  })

  it('should close login modal when X button is clicked', () => {
    // Open modal
    cy.get('[data-testid="login-button"]').click()
    cy.get('[data-testid="login-modal"]').should('be.visible')
    
    // Click X button
    cy.get('[data-testid="login-close-button"]').click()
    
    // Modal should be closed
    cy.get('[data-testid="login-modal"]').should('not.exist')
  })

  it('should close login modal when clicking outside', () => {
    // Open modal
    cy.get('[data-testid="login-button"]').click()
    cy.get('[data-testid="login-modal"]').should('be.visible')
    
    // Click outside modal (on backdrop)
    cy.get('[data-testid="login-backdrop"]').click({ force: true })
    
    // Modal should be closed
    cy.get('[data-testid="login-modal"]').should('not.exist')
  })

  it('should disable submit button when fields are empty', () => {
    // Open modal
    cy.get('[data-testid="login-button"]').click()
    
    // Submit button should be disabled
    cy.get('[data-testid="login-submit-button"]').should('be.disabled')
  })

  it('should enable submit button when fields are filled', () => {
    // Open modal
    cy.get('[data-testid="login-button"]').click()
    
    // Fill in fields
    cy.get('[data-testid="username-input"]').type('admin')
    cy.get('[data-testid="password-input"]').type('admin123')
    
    // Submit button should be enabled
    cy.get('[data-testid="login-submit-button"]').should('not.be.disabled')
  })

  it('should toggle password visibility', () => {
    // Open modal
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

  it('should show loading state during login', () => {
    // Intercept login API call to delay response
    cy.intercept('POST', '/api/v1/auth/login/', (req) => {
      req.reply((res) => {
        // Delay response to test loading state
        setTimeout(() => {
          res.send({
            statusCode: 200,
            body: {
              token: 'test-token',
              user: { id: 1, username: 'admin', email: 'admin@example.com' }
            }
          })
        }, 1000)
      })
    }).as('loginRequest')

    // Open modal and fill form
    cy.get('[data-testid="login-button"]').click()
    cy.get('[data-testid="username-input"]').type('admin')
    cy.get('[data-testid="password-input"]').type('admin123')
    
    // Submit form
    cy.get('[data-testid="login-submit-button"]').click()
    
    // Should show loading state
    cy.get('[data-testid="login-submit-button"]').should('contain', 'Logging in...')
    cy.get('[data-testid="login-submit-button"]').should('be.disabled')
    
    // Wait for request to complete
    cy.wait('@loginRequest')
  })

  it('should successfully login with valid credentials', () => {
    // Intercept successful login
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
    }).as('successfulLogin')

    // Open modal and fill form
    cy.get('[data-testid="login-button"]').click()
    cy.get('[data-testid="username-input"]').type('admin')
    cy.get('[data-testid="password-input"]').type('admin123')
    
    // Submit form
    cy.get('[data-testid="login-submit-button"]').click()
    
    // Wait for login request
    cy.wait('@successfulLogin')
    
    // Modal should be closed
    cy.get('[data-testid="login-modal"]').should('not.exist')
    
    // Should show user menu instead of login button
    cy.get('[data-testid="login-button"]').should('not.exist')
    cy.get('[data-testid="user-menu-button"]').should('be.visible')
    cy.get('[data-testid="user-menu-button"]').should('contain', 'admin')
  })

  it('should show error message for invalid credentials', () => {
    // Intercept failed login
    cy.intercept('POST', '/api/v1/auth/login/', {
      statusCode: 401,
      body: {
        detail: 'Invalid credentials'
      }
    }).as('failedLogin')

    // Open modal and fill form with invalid credentials
    cy.get('[data-testid="login-button"]').click()
    cy.get('[data-testid="username-input"]').type('invalid')
    cy.get('[data-testid="password-input"]').type('wrong')
    
    // Submit form
    cy.get('[data-testid="login-submit-button"]').click()
    
    // Wait for login request
    cy.wait('@failedLogin')
    
    // Should show error message
    cy.get('[data-testid="login-error"]').should('be.visible')
    cy.get('[data-testid="login-error"]').should('contain', 'Invalid credentials')
    
    // Modal should still be open
    cy.get('[data-testid="login-modal"]').should('be.visible')
  })

  it('should show user menu after successful login', () => {
    // Intercept successful login
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
    }).as('successfulLogin')

    // Login
    cy.get('[data-testid="login-button"]').click()
    cy.get('[data-testid="username-input"]').type('admin')
    cy.get('[data-testid="password-input"]').type('admin123')
    cy.get('[data-testid="login-submit-button"]').click()
    cy.wait('@successfulLogin')
    
    // Click user menu
    cy.get('[data-testid="user-menu-button"]').click()
    
    // Should show user dropdown
    cy.get('[data-testid="user-dropdown"]').should('be.visible')
    cy.get('[data-testid="user-dropdown"]').should('contain', 'admin')
    cy.get('[data-testid="user-dropdown"]').should('contain', 'admin@example.com')
    cy.get('[data-testid="logout-button"]').should('be.visible')
  })

  it('should logout when logout button is clicked', () => {
    // Intercept successful login
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
    }).as('successfulLogin')

    // Login
    cy.get('[data-testid="login-button"]').click()
    cy.get('[data-testid="username-input"]').type('admin')
    cy.get('[data-testid="password-input"]').type('admin123')
    cy.get('[data-testid="login-submit-button"]').click()
    cy.wait('@successfulLogin')
    
    // Open user menu and logout
    cy.get('[data-testid="user-menu-button"]').click()
    cy.get('[data-testid="logout-button"]').click()
    
    // Should show login button again
    cy.get('[data-testid="login-button"]').should('be.visible')
    cy.get('[data-testid="user-menu-button"]').should('not.exist')
  })

  it('should persist login state across page refreshes', () => {
    // Intercept successful login
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
    }).as('successfulLogin')

    // Intercept user info request for token validation
    cy.intercept('GET', '/api/v1/auth/user/', {
      statusCode: 200,
      body: {
        id: 1, 
        username: 'admin', 
        email: 'admin@example.com',
        is_superuser: true
      }
    }).as('userInfo')

    // Login
    cy.get('[data-testid="login-button"]').click()
    cy.get('[data-testid="username-input"]').type('admin')
    cy.get('[data-testid="password-input"]').type('admin123')
    cy.get('[data-testid="login-submit-button"]').click()
    cy.wait('@successfulLogin')
    
    // Verify user is logged in
    cy.get('[data-testid="user-menu-button"]').should('be.visible')
    
    // Refresh page
    cy.reload()
    
    // Should still be logged in
    cy.wait('@userInfo')
    cy.get('[data-testid="user-menu-button"]').should('be.visible')
    cy.get('[data-testid="login-button"]').should('not.exist')
  })

  it('should redirect to home page after successful login', () => {
    // Intercept successful login
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
    }).as('successfulLogin')

    // Login
    cy.get('[data-testid="login-button"]').click()
    cy.get('[data-testid="username-input"]').type('admin')
    cy.get('[data-testid="password-input"]').type('admin123')
    cy.get('[data-testid="login-submit-button"]').click()
    cy.wait('@successfulLogin')
    
    // Should be on home page
    cy.url().should('eq', Cypress.config().baseUrl + '/')
    
    // Should see home page content
    cy.get('[data-testid="user-menu-button"]').should('be.visible')
  })
})
