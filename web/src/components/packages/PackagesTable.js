/*
- File: PackagesTable.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: The dashboard table shell. Renders a header row plus one
PackageRow per package. The hover effect comes from Bootstrap Table hover.
Empty / loading / error guards live in the parent (DashboardPage), not here.

Note: no `responsive` prop on Table. Bootstrap's .table-responsive wrapper
adds overflow-x:auto, which the CSS spec implicitly turns into overflow-y:
auto as well; that clipped the kebab dropdown menus against the table's
content height. PackageRow's Dropdown also passes popperConfig.strategy
fixed as a belt-and-suspenders guard for any future overflow ancestor.
Slice 7 polish should revisit small-viewport handling without restoring
the table-responsive wrapper.
 */

import { Table } from 'react-bootstrap';
import PackageRow from './PackageRow';

export default function PackagesTable({ packages, onHide, onDelete }) {
  return (
    <Table hover>
      <thead>
        <tr>
          <th>Carrier</th>
          <th>Package</th>
          <th>Status</th>
          <th>Location and note</th>
          <th>Updated</th>
          <th>Track</th>
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
