/*
- File: SignInPage.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Sign-in page. Plain useState fields, dispatches the signin
thunk, navigates to state.from || '/' on success. Shows the friendly
INVALID_CREDENTIALS alert and clears the password field on retry.
Reads ?expired=1 to surface a blue informational alert when the user
arrived here from a force-logout.
 */

import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Form, InputGroup, Spinner } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthCard } from '../components/auth/AuthCard';
import { signin } from '../store/userSlice';
import { friendlyMessage } from '../lib/friendlyMessage';

export default function SignInPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { status, error, token } = useSelector((s) => s.user);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showExpired, setShowExpired] = useState(searchParams.get('expired') === '1');
  const passwordInputRef = useRef(null);

  const loading = status === 'loading';

  useEffect(() => {
    if (token) {
      const dest = location.state?.from?.pathname || '/';
      navigate(dest, { replace: true });
    }
  }, [token, navigate, location.state]);

  useEffect(() => {
    if (error?.code === 'INVALID_CREDENTIALS') {
      setPassword('');
      passwordInputRef.current?.focus();
    }
  }, [error]);

  const dismissExpired = () => {
    setShowExpired(false);
    const next = new URLSearchParams(searchParams);
    next.delete('expired');
    setSearchParams(next, { replace: true });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (showExpired) dismissExpired();
    dispatch(signin({ email, password }));
  };

  return (
    <AuthCard title="Sign in">
      {showExpired && (
        <Alert variant="info" dismissible onClose={dismissExpired}>
          Your session expired. Sign in again.
        </Alert>
      )}
      {error && (
        <Alert variant="danger" role="alert">
          {friendlyMessage(error, { context: 'signin' })}
        </Alert>
      )}
      <Form onSubmit={onSubmit} data-testid="page-signin">
        <Form.Group className="mb-3" controlId="signinEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            autoComplete="email"
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="signinPassword">
          <Form.Label>Password</Form.Label>
          <InputGroup>
            <Form.Control
              ref={passwordInputRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
            />
            <Button
              variant="outline-secondary"
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={loading}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </Button>
          </InputGroup>
        </Form.Group>
        <Button type="submit" className="w-100" disabled={loading}>
          {loading ? <Spinner size="sm" animation="border" /> : 'Sign in'}
        </Button>
      </Form>
      <div className="text-center mt-3">
        <Link to="/signup">Need an account? Sign up</Link>
      </div>
    </AuthCard>
  );
}
