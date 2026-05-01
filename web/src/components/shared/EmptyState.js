/*
- File: EmptyState.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Centered card for "no data" surfaces. Title is required; body
is optional descriptive copy; ctas is an optional array of { label, onClick,
variant? } entries rendered as buttons. The dashboard's empty state passes
two ctas (Add and Sync); the timeline's empty state passes none.
 */

import { Card, Button } from 'react-bootstrap';

export default function EmptyState({ title, body, ctas = [] }) {
  return (
    <Card className="text-center py-4 my-3">
      <Card.Body>
        <Card.Title>{title}</Card.Title>
        {body ? <Card.Text className="text-muted">{body}</Card.Text> : null}
        {ctas.length > 0 ? (
          <div className="d-flex justify-content-center gap-2 mt-3">
            {ctas.map((c) => (
              <Button
                key={c.label}
                variant={c.variant || 'primary'}
                onClick={c.onClick}
                disabled={c.disabled}
              >
                {c.label}
              </Button>
            ))}
          </div>
        ) : null}
      </Card.Body>
    </Card>
  );
}
