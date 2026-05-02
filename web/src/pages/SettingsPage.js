/*
- File: SettingsPage.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Settings shell. Vertical Nav on the left, nested route
content on the right. Mounts ConnectionsTab on /settings (and on
/settings/connections); routes /settings/{hidden,exclusions,account}
to their respective Slice 6 components. The OAuth callback bounce-back is
handled in a useEffect that reads useSearchParams: each recognized
gmail or gmail_error / warning value fires the matching toast or
alert and then navigates to /settings/connections to land the user
on the active tab and clear the OAuth params in one atomic step.
React 18 StrictMode runs effects twice in dev; a useRef-keyed guard
short-circuits the second pass so dispatch is naturally idempotent.
 */

import { useEffect, useRef, useState } from 'react';
import { Container, Row, Col, Nav, Alert } from 'react-bootstrap';
import { Routes, Route, Navigate, useSearchParams, useNavigate, NavLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchConnectionStatus, runSync } from '../store/gmailSlice';
import { fetchPackages } from '../store/packagesSlice';
import { pushToast } from '../store/uiSlice';
import ConnectionsTab, { syncToastForResponse } from '../components/settings/ConnectionsTab';
import HiddenTab from '../components/settings/HiddenTab';
import ExclusionsTab from '../components/settings/ExclusionsTab';
import AccountTab from '../components/settings/AccountTab';

const ERROR_ALERTS = {
  consent_denied: {
    variant: 'info',
    message: 'You cancelled the Gmail connection. No changes were made.',
  },
  state_expired: {
    variant: 'warning',
    message: 'The connection link expired. Try connecting again.',
  },
  state_invalid: {
    variant: 'danger',
    message: 'Connection failed: invalid state. Try connecting again.',
  },
  exchange_failed: {
    variant: 'danger',
    message: 'Could not complete Gmail connection. Try again or contact support.',
  },
  internal: {
    variant: 'danger',
    message: 'Internal error during Gmail connection. Please try again.',
  },
};

export default function SettingsPage() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorAlert, setErrorAlert] = useState(null);
  // Guards against React 18 StrictMode's double-invocation of effects.
  // Without this, the second pass sees the same params (the first pass's
  // setSearchParams hasn't committed yet) and re-fires the dispatch.
  const handledKeyRef = useRef(null);

  useEffect(() => {
    const gmailFlag = searchParams.get('gmail');
    const gmailError = searchParams.get('gmail_error');
    const warning = searchParams.get('warning');
    const expected = searchParams.get('expected');
    const got = searchParams.get('got');

    const key = `${gmailFlag}|${gmailError}|${warning}|${expected}|${got}`;
    if (handledKeyRef.current === key) return;
    handledKeyRef.current = key;

    if (gmailFlag === 'connected') {
      if (warning === 'different_account' && expected && got) {
        dispatch(
          pushToast({
            variant: 'warning',
            message: `Connected ${got} instead of ${expected}. That's fine, but make sure it's the right account.`,
          })
        );
      } else {
        dispatch(pushToast({ variant: 'success', message: 'Gmail connected.' }));
      }
      dispatch(fetchConnectionStatus());

      const connectionId = searchParams.get('connection_id');
      const email = searchParams.get('email');
      if (connectionId) {
        dispatch(runSync({ connection_id: connectionId }))
          .unwrap()
          .then((data) => {
            const syncResult = data.syncs[0];
            dispatch(pushToast(syncToastForResponse(syncResult, email || 'your inbox')));
            dispatch(fetchPackages());
          })
          .catch(() => {
            dispatch(
              pushToast({
                variant: 'danger',
                message: 'Auto-sync after connecting failed. Use Sync now to retry.',
              })
            );
          });
      }

      // Navigate (don't setSearchParams({})) to avoid a race with the index
      // Route's <Navigate to="connections">: setSearchParams resolves
      // navigate("?") against the closure-captured pathname /settings,
      // which would override the index Route's just-pushed /settings/connections
      // and orphan the URL at /settings (no Route match, blank pane).
      navigate('/settings/connections', { replace: true });
      return;
    }

    if (gmailError && ERROR_ALERTS[gmailError]) {
      setErrorAlert(ERROR_ALERTS[gmailError]);
      navigate('/settings/connections', { replace: true });
      return;
    }
  }, [searchParams, navigate, dispatch]);

  const navLinkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

  return (
    <Container className="px-0">
      <h2 className="mb-3">Settings</h2>
      {errorAlert ? (
        <Alert
          variant={errorAlert.variant}
          dismissible
          onClose={() => setErrorAlert(null)}
          role="alert"
        >
          {errorAlert.message}
        </Alert>
      ) : null}
      <Row>
        <Col xs={12} md={3} className="mb-3">
          <Nav variant="pills" className="flex-column">
            <NavLink to="/settings/connections" className={navLinkClass} end>
              Connections
            </NavLink>
            <NavLink to="/settings/hidden" className={navLinkClass} end>
              Hidden
            </NavLink>
            <NavLink to="/settings/exclusions" className={navLinkClass} end>
              Exclusions
            </NavLink>
            <NavLink to="/settings/account" className={navLinkClass} end>
              Account
            </NavLink>
          </Nav>
        </Col>
        <Col xs={12} md={9}>
          <Routes>
            <Route index element={<Navigate to="connections" replace />} />
            <Route path="connections" element={<ConnectionsTab />} />
            <Route path="hidden" element={<HiddenTab />} />
            <Route path="exclusions" element={<ExclusionsTab />} />
            <Route path="account" element={<AccountTab />} />
          </Routes>
        </Col>
      </Row>
    </Container>
  );
}
