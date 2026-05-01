/*
- File: EventTimeline.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Vertical stack of cards, one per event, ordered as supplied
(the API delivers events newest-first). Each card shows: status chip
top-left, dayLabel timestamp top-right, location below as muted text,
description as primary text. Empty state copy lives inside the parent
page (PackageDetailPage); this component renders nothing when events is
empty so the parent decides whether to show the empty card or hide the
section entirely.
 */

import { Card, Stack } from 'react-bootstrap';
import { dayLabel } from '../../lib/dayLabel';
import StatusChip from './StatusChip';

export default function EventTimeline({ events }) {
  if (!events || events.length === 0) return null;
  return (
    <Stack gap={2}>
      {events.map((ev, i) => (
        <Card key={`${ev.event_time}-${ev.carrier_raw_status}-${i}`}>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start mb-1">
              <StatusChip status={ev.status} />
              <small className="text-muted">{dayLabel(ev.event_time)}</small>
            </div>
            {ev.location ? <div className="text-muted small mb-1">{ev.location}</div> : null}
            {ev.description ? <div>{ev.description}</div> : null}
          </Card.Body>
        </Card>
      ))}
    </Stack>
  );
}
