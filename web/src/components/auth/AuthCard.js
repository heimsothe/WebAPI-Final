/*
- File: AuthCard.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Centered card layout shared by SignInPage and SignUpPage.
Holds the brand line, the page-specific title, and the form children.
 */

import { Card, Container } from 'react-bootstrap';

export function AuthCard({ title, children }) {
  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '100vh' }}
    >
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <Card.Body>
          <div className="text-center mb-3 fw-bold text-secondary">Package Tracker</div>
          <Card.Title as="h4" className="text-center mb-4">
            {title}
          </Card.Title>
          {children}
        </Card.Body>
      </Card>
    </Container>
  );
}
