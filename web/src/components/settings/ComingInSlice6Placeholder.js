/*
- File: ComingInSlice6Placeholder.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: A placeholder card for the three Settings tabs that ship
in Slice 6 (Hidden, Exclusions, Account). Renders the tab's own title
plus a one-line "Coming in Slice 6" message. Replaced when each tab's
real component lands. Slice 4 deep-links to /settings/exclusions; this
ensures the navigation does not 404 in the meantime.
 */

import { Card } from 'react-bootstrap';

export default function ComingInSlice6Placeholder({ title }) {
  return (
    <Card>
      <Card.Body>
        <Card.Title>{title}</Card.Title>
        <Card.Text className="text-muted">This tab ships in Slice 6.</Card.Text>
      </Card.Body>
    </Card>
  );
}
