/*
- File: SignUpPage.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Sign-up page. Same shell as SignInPage with one extra
field (confirm password) and an optional display_name. Auto-signs-in
on fulfilled per the design spec: the API returns the token directly
so there is no detour through /signin. Mismatched passwords are
caught client-side before dispatching. EMAIL_TAKEN renders inline
on the email field via Bootstrap's invalid-feedback machinery.
 */

import { useEffect, useState } from 'react';
import { Alert, Button, Form, InputGroup, Spinner } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthCard } from '../components/auth/AuthCard';
import { signup } from '../store/userSlice';
import { friendlyMessage } from '../lib/friendlyMessage';

export default function SignUpPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error, token } = useSelector((s) => s.user);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  const loading = status === 'loading';
  const passwordsMatch = password === confirmPassword;
  const showMismatch = confirmTouched && !passwordsMatch;

  const fieldError = (field) =>
    error?.code === 'VALIDATION_FAILED'
      ? error.details?.find((d) => d.field === field)?.message
      : null;

  const emailServerError = error?.code === 'EMAIL_TAKEN' ? error.message : fieldError('email');
  const passwordServerError = fieldError('password');

  useEffect(() => {
    if (token) {
      const dest = location.state?.from?.pathname || '/';
      navigate(dest, { replace: true });
    }
  }, [token, navigate, location.state]);

  const onSubmit = (e) => {
    e.preventDefault();
    setConfirmTouched(true);
    if (!passwordsMatch) return;
    dispatch(
      signup({
        email,
        password,
        display_name: displayName.trim() ? displayName.trim() : undefined,
      })
    );
  };

  return (
    <AuthCard title="Create your account">
      {error && error.code !== 'EMAIL_TAKEN' && error.code !== 'VALIDATION_FAILED' && (
        <Alert variant="danger" role="alert">
          {friendlyMessage(error, { context: 'signup' })}
        </Alert>
      )}
      <Form onSubmit={onSubmit} noValidate data-testid="page-signup">
        <Form.Group className="mb-3" controlId="signupEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            isInvalid={Boolean(emailServerError)}
            autoComplete="email"
          />
          {emailServerError && (
            <Form.Control.Feedback type="invalid">{emailServerError}</Form.Control.Feedback>
          )}
        </Form.Group>
        <Form.Group className="mb-3" controlId="signupPassword">
          <Form.Label>Password</Form.Label>
          <InputGroup>
            <Form.Control
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              isInvalid={Boolean(passwordServerError)}
              autoComplete="new-password"
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
            {passwordServerError && (
              <Form.Control.Feedback type="invalid">{passwordServerError}</Form.Control.Feedback>
            )}
          </InputGroup>
        </Form.Group>
        <Form.Group className="mb-3" controlId="signupConfirm">
          <Form.Label>Confirm password</Form.Label>
          <Form.Control
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => setConfirmTouched(true)}
            required
            disabled={loading}
            isInvalid={showMismatch}
            autoComplete="new-password"
          />
          {showMismatch && (
            <Form.Control.Feedback type="invalid">Passwords do not match.</Form.Control.Feedback>
          )}
        </Form.Group>
        <Form.Group className="mb-3" controlId="signupDisplayName">
          <Form.Label>Display name</Form.Label>
          <Form.Control
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How should we greet you? (optional)"
            disabled={loading}
            maxLength={100}
          />
        </Form.Group>
        <Button type="submit" className="w-100" disabled={loading}>
          {loading ? <Spinner size="sm" animation="border" /> : 'Sign up'}
        </Button>
      </Form>
      <div className="text-center mt-3">
        <Link to="/signin">Already have an account? Sign in</Link>
      </div>
    </AuthCard>
  );
}
