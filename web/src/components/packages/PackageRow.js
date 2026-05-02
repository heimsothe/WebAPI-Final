/*
- File: PackageRow.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: One dashboard row. Columns: Carrier (CarrierBadge), Package
(nickname or fallback + tracking number Link), Status (StatusChip from
latest_event), Location and note (latest_event.location plus description),
Updated (relTime of latest_event.event_time), kebab actions.

The nickname column is wrapped in a Link to the detail page for keyboard
accessibility; the kebab dropdown stops click propagation per Bootstrap's
default so kebab clicks do not also trigger row navigation.
 */

import { Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaEllipsisV, FaExternalLinkAlt } from 'react-icons/fa';
import StatusChip from './StatusChip';
import CarrierBadge from './CarrierBadge';
import { relTime } from '../../lib/relTime';
import { carrierDisplay } from '../../lib/carrierDisplay';

export default function PackageRow({ pkg, onHide, onDelete }) {
  const display = pkg.nickname || `Package #${pkg.tracking_number.slice(-6)}`;
  const status = pkg.latest_event?.status;
  const location = pkg.latest_event?.location;
  const description = pkg.latest_event?.description;
  const updated = pkg.latest_event?.event_time;

  return (
    <tr>
      <td>
        <CarrierBadge code={pkg.carrier} />
      </td>
      <td>
        <Link to={`/packages/${pkg.id}`} className="text-decoration-none">
          <div className="fw-semibold">{display}</div>
          <small className="text-muted font-monospace">{pkg.tracking_number}</small>
        </Link>
      </td>
      <td>
        <StatusChip status={status} />
      </td>
      <td>
        {location ? <div>{location}</div> : null}
        {description ? <small className="text-muted">{description}</small> : null}
      </td>
      <td>
        <small className="text-muted">{relTime(updated)}</small>
      </td>
      <td>
        {pkg.tracking_url ? (
          <a
            href={pkg.tracking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-decoration-none"
            aria-label={`Open on ${carrierDisplay(pkg.carrier)} tracking site`}
          >
            <FaExternalLinkAlt className="me-1" /> Track
          </a>
        ) : null}
      </td>
      <td className="text-end">
        {/* popperConfig.strategy='fixed' floats the menu above the table-responsive
            overflow context, which would otherwise clip a menu rendered near the top
            row to the table's visible height. */}
        <Dropdown align="end" popperConfig={{ strategy: 'fixed' }}>
          <Dropdown.Toggle
            variant="link"
            size="sm"
            className="text-secondary p-1 border-0 no-caret"
            aria-label={`Actions for ${display}`}
          >
            <FaEllipsisV />
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item as={Link} to={`/packages/${pkg.id}`}>
              View detail
            </Dropdown.Item>
            <Dropdown.Item onClick={() => onHide(pkg)}>Hide</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item className="text-danger" onClick={() => onDelete(pkg)}>
              Delete
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </td>
    </tr>
  );
}
