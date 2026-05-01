/*
- File: PackagesTable.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: The dashboard table shell. Renders a header row plus one
PackageRow per package. The hover effect comes from Bootstrap Table hover.
Empty / loading / error guards live in the parent (DashboardPage), not here.
 */

import { Table } from 'react-bootstrap';
import PackageRow from './PackageRow';

export default function PackagesTable({ packages, onHide, onDelete }) {
  return (
    <Table hover responsive>
      <thead>
        <tr>
          <th>Carrier</th>
          <th>Package</th>
          <th>Status</th>
          <th>Location and note</th>
          <th>Updated</th>
          <th className="text-end">Actions</th>
        </tr>
      </thead>
      <tbody>
        {packages.map((pkg) => (
          <PackageRow key={pkg.id} pkg={pkg} onHide={onHide} onDelete={onDelete} />
        ))}
      </tbody>
    </Table>
  );
}
