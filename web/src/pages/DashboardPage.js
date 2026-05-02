/*
- File: DashboardPage.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: The signed-in user's home page. Lists active packages with
priority sort, search, status filter, and per-row kebab actions (View,
Hide, Delete). Hide is one click with an undo toast; Delete opens a
ConfirmModal before dispatching. Slice 4 wired the Add Package modal:
clicking either the top-row "Add package" button or the empty-state
CTA toggles isAddOpen, which mounts <AddPackageModal>. The modal owns
its form state and the createPackage thunk; on success it pushes a
toast and calls onClose, which dispatches fetchPackages back here for
a fresh list. Slice 5 wires Sync; until then, "Sync Gmail" links to
the placeholder /sync route.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Form,
  ButtonGroup,
  ToggleButton,
  Button,
  Badge,
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPackages, patchPackage, deletePackage, refreshAllPackages } from '../store/packagesSlice';
import { pushToast } from '../store/uiSlice';
import { comparePackages } from '../lib/comparePackages';
import { carrierDisplay } from '../lib/carrierDisplay';
import PackagesTable from '../components/packages/PackagesTable';
import AddPackageModal from '../components/packages/AddPackageModal';
import EmptyState from '../components/shared/EmptyState';
import ErrorAlert from '../components/shared/ErrorAlert';
import Spinner from '../components/shared/Spinner';
import ConfirmModal from '../components/shared/ConfirmModal';

const STATUS_FILTERS = [
  { id: 'all', label: 'All', match: () => true },
  {
    id: 'out',
    label: 'Out for delivery',
    match: (p) => p.latest_event?.status === 'OUT_FOR_DELIVERY',
  },
  { id: 'in', label: 'In transit', match: (p) => p.latest_event?.status === 'IN_TRANSIT' },
  { id: 'del', label: 'Delivered', match: (p) => p.latest_event?.status === 'DELIVERED' },
  { id: 'exc', label: 'Exception', match: (p) => p.latest_event?.status === 'EXCEPTION' },
];

function emptyFilterCopy(query, filterId) {
  const trimmed = query.trim();
  const filter = STATUS_FILTERS.find((f) => f.id === filterId) || STATUS_FILTERS[0];
  const statusActive = filter.id !== 'all';
  if (trimmed && statusActive) return `No packages match "${trimmed}" with status ${filter.label}.`;
  if (trimmed) return `No packages match "${trimmed}".`;
  if (statusActive) return `No packages with status ${filter.label}.`;
  return 'No packages match the current filter.';
}

export function refreshAllToastFromResponse({ total, refreshed, skipped }) {
  if (total === 0) return { variant: 'secondary', message: 'No packages to refresh.' };
  if (refreshed.length === total) {
    return {
      variant: 'success',
      message: `Refreshed ${total} ${total === 1 ? 'package' : 'packages'}.`,
    };
  }
  const counts = skipped.reduce((acc, s) => {
    acc[s.skip_reason] = (acc[s.skip_reason] || 0) + 1;
    return acc;
  }, {});
  const parts = [];
  if (counts.rate_limited)        parts.push(`${counts.rate_limited} cooling down`);
  if (counts.no_adapter)          parts.push(`${counts.no_adapter} from carriers we do not track`);
  if (counts.not_found)           parts.push(`${counts.not_found} not recognized`);
  if (counts.carrier_unavailable) parts.push(`${counts.carrier_unavailable} carrier unavailable`);
  if (counts.auth_failed)         parts.push(`${counts.auth_failed} auth failed`);
  if (counts.bad_request)         parts.push(`${counts.bad_request} bad request`);
  return {
    variant: refreshed.length > 0 ? 'secondary' : 'warning',
    message: `Refreshed ${refreshed.length} of ${total}. ${parts.join(', ')}.`,
  };
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, listStatus, listError, refreshingAllStatus } = useSelector((s) => s.packages);
  const [query, setQuery] = useState('');
  const [filterId, setFilterId] = useState('all');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchPackages());
  }, [dispatch]);

  const sortedAndFiltered = useMemo(() => {
    const filter = STATUS_FILTERS.find((f) => f.id === filterId) || STATUS_FILTERS[0];
    const q = query.trim().toLowerCase();
    return [...items]
      .sort(comparePackages)
      .filter((p) => filter.match(p))
      .filter((p) => {
        if (!q) return true;
        const haystacks = [p.nickname || '', p.tracking_number, carrierDisplay(p.carrier)];
        return haystacks.some((h) => h.toLowerCase().includes(q));
      });
  }, [items, query, filterId]);

  const handleHide = (pkg) => {
    dispatch(patchPackage({ id: pkg.id, fields: { hidden: true } })).then((action) => {
      if (action.meta.requestStatus !== 'fulfilled') return;
      dispatch(
        pushToast({
          variant: 'secondary',
          message: 'Hidden. Find it in Settings > Hidden.',
          action: {
            label: 'Undo',
            onClick: () => dispatch(patchPackage({ id: pkg.id, fields: { hidden: false } })),
          },
        })
      );
    });
  };

  const handleDelete = (pkg) => setPendingDelete(pkg);

  const confirmDelete = () => {
    const pkg = pendingDelete;
    if (!pkg) return;
    setPendingDelete(null);
    dispatch(deletePackage(pkg.id)).then((action) => {
      if (action.meta.requestStatus !== 'fulfilled') return;
      dispatch(
        pushToast({
          variant: 'secondary',
          message: 'Deleted. Tracking number added to your exclusions list.',
        })
      );
    });
  };

  const handleRefreshAll = () => {
    dispatch(refreshAllPackages())
      .unwrap()
      .then((data) => {
        dispatch(pushToast(refreshAllToastFromResponse(data)));
        dispatch(fetchPackages());
      })
      .catch(() => {
        dispatch(pushToast({ variant: 'danger', message: 'Refresh failed. Try again.' }));
      });
  };

  return (
    <Container fluid className="px-0">
      <Row className="align-items-center mb-3">
        <Col>
          <h2 className="mb-0">
            Active packages{' '}
            <Badge bg="light" text="dark">
              {items.length}
            </Badge>
          </h2>
        </Col>
        <Col xs="auto">
          <Link to="/sync" className="btn btn-outline-secondary me-2">
            Sync Gmail
          </Link>
          <Button
            variant="outline-secondary"
            className="me-2"
            onClick={handleRefreshAll}
            disabled={refreshingAllStatus === 'loading'}
          >
            {refreshingAllStatus === 'loading' ? <Spinner size="sm" /> : 'Refresh status'}
          </Button>
          <Button variant="primary" onClick={() => setIsAddOpen(true)}>
            Add package
          </Button>
        </Col>
      </Row>

      <Row className="align-items-center mb-3 g-2">
        <Col xs={12} md={4}>
          <Form.Control
            type="search"
            placeholder="Search nickname, tracking number, or carrier"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Col>
        <Col>
          <ButtonGroup>
            {STATUS_FILTERS.map((f) => (
              <ToggleButton
                key={f.id}
                id={`filter-${f.id}`}
                type="radio"
                variant={filterId === f.id ? 'primary' : 'outline-primary'}
                name="status-filter"
                value={f.id}
                checked={filterId === f.id}
                onChange={(e) => setFilterId(e.currentTarget.value)}
              >
                {f.label}
              </ToggleButton>
            ))}
          </ButtonGroup>
        </Col>
      </Row>

      {listError ? <ErrorAlert error={listError} /> : null}

      {listStatus === 'loading' && items.length === 0 ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState
          title="No packages yet"
          body="Add a package manually, or sync your Gmail inbox to find tracking numbers."
          ctas={[
            { label: 'Add package', onClick: () => setIsAddOpen(true) },
            { label: 'Sync Gmail', variant: 'outline-primary', onClick: () => navigate('/sync') },
          ]}
        />
      ) : sortedAndFiltered.length === 0 ? (
        <p className="text-muted">{emptyFilterCopy(query, filterId)}</p>
      ) : (
        <PackagesTable packages={sortedAndFiltered} onHide={handleHide} onDelete={handleDelete} />
      )}

      <ConfirmModal
        show={Boolean(pendingDelete)}
        title="Delete package?"
        body="Delete this package? The tracking number will be added to your exclusions list, so Gmail will not re-import it. You can remove it from exclusions later."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <AddPackageModal show={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </Container>
  );
}
