/*
- File: AccountTab.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Settings > Account tab. Read-only Card showing the user's
email, display name (or dash placeholder), and member-since date. The
sole action is "Log out", which mirrors NavBar's pattern: dispatch the
logout reducer (clears token + user from state and localStorage) and
navigate('/signin'). Inline muted note acknowledges that password change
is not supported in V1 (no API endpoint exists; surfacing the gap
honestly avoids a misleading UI).
 */

import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/userSlice';
import { dayLabel } from '../../lib/dayLabel';

export default function AccountTab() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.user.user);

  const onLogout = () => {
    dispatch(logout());
    navigate('/signin', { replace: true });
  };

  if (!user) {
    return (
      <div>
        <h4 className="mb-3">Account</h4>
        <p className="text-muted">Loading account info...</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="mb-3">Account</h4>
      <Card className="mb-3">
        <Card.Body>
          <dl className="row mb-0">
            <dt className="col-sm-3">Email</dt>
            <dd className="col-sm-9">{user.email}</dd>

            <dt className="col-sm-3">Display name</dt>
            <dd className="col-sm-9">{user.display_name || '-'}</dd>

            <dt className="col-sm-3">Member since</dt>
            <dd className="col-sm-9">{dayLabel(user.created_at)}</dd>
          </dl>
        </Card.Body>
      </Card>
      <Button variant="outline-danger" onClick={onLogout}>
        Log out
      </Button>
      <div className="text-muted small mt-2">Password changes aren't supported yet.</div>
    </div>
  );
}
