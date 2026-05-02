/*
- File: ConnectionsTab.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Settings > Connections tab. Lists connected Gmail accounts
with per-card Sync now / Reconnect (when needs_reauth) / Disconnect
buttons; bottom Connect Gmail button always visible. Uses the shared
ConfirmModal for the destructive disconnect path. Inline sync uses
runSync({ connection_id }) and consumes the per-connection result via
the dispatched action's payload, mapped to a toast through
syncToastForResponse. The Connect / Reconnect path follows architectural
decision A: the thunk returns authorization_url, the page assigns
window.location.href.
 */

import { useEffect, useState } from 'react';
import { Button, Card, Badge, Stack, Alert } from 'react-bootstrap';
import { FaGoogle } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchConnectionStatus,
  startConnect,
  runSync,
  disconnectConnection,
} from '../../store/gmailSlice';
import { pushToast } from '../../store/uiSlice';
import { relTime } from '../../lib/relTime';
import { friendlyMessage } from '../../lib/friendlyMessage';
import ConfirmModal from '../shared/ConfirmModal';
import Spinner from '../shared/Spinner';

export function syncToastForResponse(syncResult, displayName) {
  if (!syncResult.skipped) {
    if (syncResult.imported > 0) {
      const pkgWord = syncResult.imported === 1 ? 'package' : 'packages';
      const emailWord = syncResult.scanned === 1 ? 'email' : 'emails';
      return {
        variant: 'success',
        message: `Synced ${displayName}: added ${syncResult.imported} ${pkgWord} from ${syncResult.scanned} ${emailWord}.`,
      };
    }
    const emailWord = syncResult.scanned === 1 ? 'email' : 'emails';
    return {
      variant: 'secondary',
      message: `Synced ${displayName}: no new packages found in ${syncResult.scanned} ${emailWord}.`,
    };
  }
  switch (syncResult.skip_reason) {
    case 'rate_limited':
      return {
        variant: 'secondary',
        message: `${displayName} was synced recently. Try again in a few minutes.`,
      };
    case 'needs_reauth':
      return {
        variant: 'warning',
        message: `${displayName} needs you to reconnect before it can sync.`,
      };
    case 'auth_failed':
      return {
        variant: 'warning',
        message: `${displayName}: authorization failed. Try reconnecting.`,
      };
    case 'internal':
    default:
      return {
        variant: 'danger',
        message: `${displayName}: sync failed. Try again in a moment.`,
      };
  }
}

function ConnectionCard({
  connection,
  onSync,
  onReconnect,
  onDisconnect,
  syncing,
  disconnecting,
  connecting,
}) {
  return (
    <Card className="mb-3">
      <Card.Body>
        <Stack direction="horizontal" gap={3} className="align-items-start">
          <div className="me-auto">
            <div className="fw-bold fs-5">{connection.connected_email}</div>
            <div className="text-muted small">
              {connection.last_sync_at
                ? `Last synced ${relTime(connection.last_sync_at)}`
                : 'Never synced'}
            </div>
            {connection.needs_reauth ? (
              <Badge bg="warning" text="dark" className="mt-2">
                Re-authentication needed
              </Badge>
            ) : null}
          </div>
          <Stack direction="horizontal" gap={2}>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => onSync(connection)}
              disabled={syncing || disconnecting}
            >
              {syncing ? <Spinner size="sm" /> : 'Sync now'}
            </Button>
            {connection.needs_reauth ? (
              <Button
                variant="outline-warning"
                size="sm"
                onClick={() => onReconnect(connection)}
                disabled={connecting || disconnecting}
              >
                {connecting ? <Spinner size="sm" /> : 'Reconnect'}
              </Button>
            ) : null}
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => onDisconnect(connection)}
              disabled={disconnecting || syncing}
            >
              {disconnecting ? <Spinner size="sm" /> : 'Disconnect'}
            </Button>
          </Stack>
        </Stack>
      </Card.Body>
    </Card>
  );
}

export default function ConnectionsTab() {
  const dispatch = useDispatch();
  const { connections, status, error, syncingIds, disconnectingIds, connectStatus, connectError } =
    useSelector((s) => s.gmail);
  const [pendingDisconnect, setPendingDisconnect] = useState(null);

  useEffect(() => {
    dispatch(fetchConnectionStatus());
  }, [dispatch]);

  const handleSync = async (connection) => {
    const action = await dispatch(runSync({ connection_id: connection.id }));
    if (action.meta.requestStatus === 'fulfilled') {
      const matchedSync =
        action.payload.syncs.find((s) => s.connection_id === connection.id) ||
        action.payload.syncs[0];
      const toast = syncToastForResponse(matchedSync, connection.connected_email);
      dispatch(pushToast(toast));
    } else {
      dispatch(
        pushToast({
          variant: 'danger',
          message: `Sync failed for ${connection.connected_email}: ${friendlyMessage(action.payload, { context: 'sync' })}`,
        })
      );
    }
  };

  const handleConnect = async (reconnectId = null) => {
    const action = await dispatch(startConnect(reconnectId ? { reconnectId } : {}));
    if (action.meta.requestStatus === 'fulfilled') {
      window.location.href = action.payload.authorization_url;
    }
  };

  const handleReconnect = (connection) => handleConnect(connection.id);

  const confirmDisconnect = async () => {
    const conn = pendingDisconnect;
    if (!conn) return;
    setPendingDisconnect(null);
    const action = await dispatch(disconnectConnection(conn.id));
    if (action.meta.requestStatus === 'fulfilled') {
      dispatch(
        pushToast({
          variant: 'secondary',
          message: `Disconnected ${conn.connected_email}.`,
        })
      );
    } else {
      dispatch(
        pushToast({
          variant: 'danger',
          message: `Could not disconnect ${conn.connected_email}: ${friendlyMessage(action.payload)}`,
        })
      );
    }
  };

  return (
    <div>
      <h4 className="mb-3">Connected Google accounts</h4>
      {error ? (
        <Alert variant="danger" role="alert">
          {error.message}
        </Alert>
      ) : null}
      {connectError ? (
        <Alert variant="danger" role="alert">
          {connectError.message}
        </Alert>
      ) : null}
      {status === 'loading' && connections.length === 0 ? <Spinner /> : null}
      {connections.map((c) => (
        <ConnectionCard
          key={c.id}
          connection={c}
          onSync={handleSync}
          onReconnect={handleReconnect}
          onDisconnect={(conn) => setPendingDisconnect(conn)}
          syncing={syncingIds.includes(c.id)}
          disconnecting={disconnectingIds.includes(c.id)}
          connecting={connectStatus === 'loading'}
        />
      ))}

      <div className="mt-4">
        <Button
          variant="primary"
          onClick={() => handleConnect(null)}
          disabled={connectStatus === 'loading'}
        >
          <FaGoogle className="me-2" />
          {connectStatus === 'loading' ? 'Redirecting to Google...' : 'Connect Gmail'}
        </Button>
        <div className="text-muted small mt-2">
          You can connect more than one Google account. Each appears as its own card above.
        </div>
      </div>

      <ConfirmModal
        show={Boolean(pendingDisconnect)}
        title="Disconnect Gmail account?"
        body={
          pendingDisconnect
            ? `Disconnecting ${pendingDisconnect.connected_email} removes the saved Google authorization. Tracked packages stay on your dashboard, but no new ones will be imported from this account until you reconnect.`
            : ''
        }
        confirmText="Disconnect"
        onConfirm={confirmDisconnect}
        onCancel={() => setPendingDisconnect(null)}
      />
    </div>
  );
}
