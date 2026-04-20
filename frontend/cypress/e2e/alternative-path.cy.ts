/// <reference types="cypress" />

describe('Alternate Path - Element Editing', () => {
  const email = `test${Date.now()}@test.com`;
  const password = 'password123';
  const name = 'Test User';

  it('complete element editing path', () => {
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
    cy.get('[role="dialog"] input[placeholder="Enter your name"]').type('Element Test');
    cy.get('[role="dialog"]').contains('button', 'Create').click();
    cy.wait(1000);
    cy.contains('Element Test').click();
    cy.wait(1000);

    // 3. Add text element
    cy.contains('button', '+ Add Text').click();
    cy.wait(500);
    cy.get('[role="dialog"] textarea').type('Hello World');
    cy.get('[role="dialog"]').contains('button', 'Create').click();
    cy.wait(1000);
    cy.contains('Hello World').should('exist');

    // 4. Add image element
    cy.contains('button', '+ Add image').click();
    cy.wait(500);
    cy.get('[role="dialog"]').contains('button', 'Switch to URL').click();
    cy.get('[role="dialog"] input[placeholder="Enter url of Image"]').type('https://picsum.photos/300');
    cy.get('[role="dialog"] input[placeholder="Describe the image"]').type('test image');
    cy.get('[role="dialog"]').contains('button', 'Create').click();
    cy.wait(1000);

    // 5. Double click to edit text element
    cy.contains('Hello World').dblclick({ force: true });
    cy.wait(500);
    cy.get('[role="dialog"] textarea').clear().type('Updated Text');
    cy.get('[role="dialog"]').contains('button', 'Save').click();
    cy.wait(1000);
    cy.contains('Updated Text').should('exist');

    // 6. Right click to delete text element
    cy.contains('Updated Text').rightclick({ force: true });
    cy.wait(1000);

    // 7. Change slide background
    cy.contains('button', '+ Add background').click();
    cy.wait(500);
    cy.get('[role="dialog"]').contains('button', 'Solid').click();
    cy.get('[role="dialog"] input[placeholder="#ffffff"]').first().clear().type('#ff0000');
    cy.get('[role="dialog"]').contains('button', 'Apply to Slide').click();
    cy.wait(1000);
    cy.get('[role="dialog"]').contains('button', 'Close').click();
    cy.wait(500);

    // 8. Logout
    cy.contains('button', 'Back').click();
    cy.wait(500);
    cy.contains('button', 'Logout').click();
    cy.wait(500);
    cy.url().should('not.include', '/dashboard');
  });
});