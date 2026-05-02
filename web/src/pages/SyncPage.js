/*
- File: SyncPage.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Global Gmail sync page. Single primary button: "Sync <email>"
when one connection exists, "Sync all Gmail accounts (N)" when multiple.
Empty state with CTA to /settings/connections when zero. While the
global sync is in flight, shows a card-sized spinner with the
"Scanning your inbox..." copy. After the sync, renders a result block
with totals computed from state.gmail.lastSyncResult.syncs at render
time (the API does not return aggregates per architectural decision F).
On rejection, surfaces the friendly message via friendlyMessage with
the 'sync' context.
 */

import { useEffect } from 'react';
import { Container, Button, Card, Alert, Stack } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchConnectionStatus, runSync } from '../store/gmailSlice';
import { friendlyMessage } from '../lib/friendlyMessage';
import EmptyState from '../components/shared/EmptyState';
import Spinner from '../components/shared/Spinner';

function ResultBlock({ result, multipleConnections }) {
  const total_added = result.syncs.reduce((acc, s) => acc + (s.imported || 0), 0);
  const total_scanned = result.syncs.reduce((acc, s) => acc + (s.scanned || 0), 0);
  const total_skipped = result.syncs.filter((s) => s.skipped).length;

  return (
    <Card className="mt-3">
      <Card.Body>
        <Card.Title>Sync complete</Card.Title>
        <Card.Text>
          Added {total_added} {total_added === 1 ? 'package' : 'packages'}. Scanned {total_scanned}{' '}
          {total_scanned === 1 ? 'email' : 'emails'}.
        </Card.Text>
        {total_skipped > 0 ? (
          <Card.Text className="text-muted small">
            {total_skipped} {total_skipped === 1 ? 'connection was' : 'connections were'} skipped.
          </Card.Text>
        ) : null}
        {multipleConnections ? (
          <Stack gap={2} className="mt-3">
            <strong className="small">Per-connection breakdown:</strong>
            {result.syncs.map((s) => (
              <div key={s.connection_id} className="small">
                {s.connected_email}:{' '}
                {s.skipped
                  ? `skipped (${s.skip_reason})`
                  : `added ${s.imported || 0}, scanned ${s.scanned || 0}`}
              </div>
            ))}
          </Stack>
        ) : null}
        <div className="mt-3">
          <Link to="/" className="btn btn-outline-primary btn-sm">
            Back to dashboard
          </Link>
        </div>
      </Card.Body>
    </Card>
  );
}

export default function SyncPage() {
  const dispatch = useDispatch();
  const { connections, status, globalSyncStatus, globalSyncError, lastSyncResult } = useSelector(
    (s) => s.gmail
  );

  useEffect(() => {
    if (status !== 'succeeded') {
      dispatch(fetchConnectionStatus());
    }
  }, [dispatch, status]);

  const onSync = () => {
    dispatch(runSync({}));
  };

  if (status === 'loading') {
    return (
      <Container className="px-0">
        <Spinner />
      </Container>
    );
  }

  if (connections.length === 0) {
    return (
      <Container className="px-0">
        <EmptyState
          title="Connect Gmail to scan for tracking numbers"
          body="The Gmail sync looks at your inbox for shipping confirmations and adds the tracking numbers it finds. Connect a Google account to get started."
          ctas={[
            {
              label: 'Connect Gmail',
              variant: 'primary',
              as: Link,
              to: '/settings/connections',
            },
          ]}
        />
      </Container>
    );
  }

  const buttonLabel =
    connections.length === 1
      ? `Sync ${connections[0].connected_email}`
      : `Sync all Gmail accounts (${connections.length})`;

  return (
    <Container className="px-0">
      <h2 className="mb-3">Gmail sync</h2>
      <p className="text-muted">
        Scans the connected inbox{connections.length === 1 ? '' : 'es'} for shipping confirmations
        and adds any tracking numbers it finds to your dashboard.
      </p>

      <Button
        variant="primary"
        size="lg"
        onClick={onSync}
        disabled={globalSyncStatus === 'loading'}
      >
        {buttonLabel}
      </Button>

      {globalSyncStatus === 'loading' ? (
        <Card className="mt-3">
          <Card.Body className="text-center">
            <Spinner />
            <div className="mt-3 text-muted">Scanning your inbox...</div>
          </Card.Body>
        </Card>
      ) : null}

      {globalSyncError ? (
        <Alert variant="danger" className="mt-3" role="alert">
          {friendlyMessage(globalSyncError, { context: 'sync' })}
        </Alert>
      ) : null}

      {globalSyncStatus === 'succeeded' && lastSyncResult ? (
        <ResultBlock result={lastSyncResult} multipleConnections={connections.length > 1} />
      ) : null}
    </Container>
  );
}
