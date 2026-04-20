/// <reference types="cypress" />

describe('Happy Path', () => {
  const email = `test${Date.now()}@test.com`;
  const password = 'password123';
  const name = 'Test User';

  it('complete happy path', () => {
    // 1. Register
    cy.visit('/register');
    cy.get('input[placeholder="Enter your name"]').type(name);
    cy.get('input[placeholder="Enter your email"]').type(email);
    cy.get('input[placeholder="Enter your password"]').type(password);
    cy.get('input[placeholder="Confirm your password"]').type(password);
    cy.contains('button', 'Create Account').click();
    cy.wait(1000);
    cy.url().should('include', '/dashboard');

    // 2. Create presentation
    cy.contains('button', 'New Presentation').click();
    cy.wait(500);
    cy.get('[role="dialog"] input[placeholder="Enter your name"]').type('Test Presentation');
    cy.get('[role="dialog"] input[placeholder="Enter your description"]').type('Test Description');
    cy.get('[role="dialog"]').contains('button', 'Create').click();
    cy.wait(1000);
    cy.contains('Test Presentation').should('exist');

    // 3. Update thumbnail and name
    cy.contains('Test Presentation').click();
    cy.wait(1000);
    cy.contains('button', 'Edit').click();
    cy.wait(500);
    cy.get('.fixed input').first().clear().type('Updated Presentation');
    cy.get('.fixed input[placeholder="Thumbnail URL"]').clear().type('https://picsum.photos/200');
    cy.contains('button', 'Save').click();
    cy.wait(1000);
    cy.contains('Updated Presentation').should('exist');

    // 4. Add slides
    cy.contains('button', '+ Add Slide').click();
    cy.wait(500);
    cy.contains('button', '+ Add Slide').click();
    cy.wait(500);
    cy.contains('Slide 3').should('exist');

    // 5. Switch between slides
    cy.contains('Slide 1').click();
    cy.wait(300);
    cy.contains('Slide 2').click();
    cy.wait(300);
    cy.contains('Slide 3').click();
    cy.wait(300);

    // 6. Delete presentation
    cy.contains('button', 'Delete').click();
    cy.wait(500);
    cy.contains('button', 'Yes').click();
    cy.wait(1000);
    cy.url().should('include', '/dashboard');

    // 7. Logout
    cy.contains('button', 'Logout').click();
    cy.wait(500);

    // 8. Login again
    cy.visit('/login');
    cy.get('input[placeholder="Enter your email"]').type(email);
    cy.get('input[placeholder="Enter your password"]').type(password);
    cy.contains('button', 'Login').click();
    cy.wait(1000);
    cy.url().should('include', '/dashboard');
  });
});