/*
- File: EmptyState.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Centered card for "no data" surfaces. Title is required; body
is optional descriptive copy; ctas is an optional array of CTA objects
rendered as buttons. Each CTA must have a `label`; all other props are
spread onto the underlying Bootstrap Button (so callers can pass onClick,
variant, disabled, as, to, href, etc.). The dashboard's empty state passes
{label, onClick} CTAs; SyncPage passes {label, as: Link, to, variant} for
its navigation CTA.
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
            {ctas.map((cta, i) => {
              const { label, ...rest } = cta;
              return (
                <Button key={i} variant={rest.variant || 'primary'} {...rest}>
                  {label}
                </Button>
              );
            })}
          </div>
        ) : null}
      </Card.Body>
    </Card>
  );
}
