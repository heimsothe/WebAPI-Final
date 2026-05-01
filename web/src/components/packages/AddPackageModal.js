/*
- File: AddPackageModal.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Bootstrap modal for adding a tracked package. Owns the
form state via useState (tracking, carrier, nickname, plus the
userOverrodeCarrier sticky boolean per Slice 4 decision C). Auto-detect
runs on tracking-input blur via the lib/classifyTracking helper, and
only writes to the carrier field when the user has not yet manually
overridden it. On submit, the tracking number is normalized
(trim + uppercase) and the createPackage thunk is dispatched. The
fulfilled path pushes a success toast, calls onClose, and dispatches
fetchPackages to refresh the dashboard. The rejected path stays in
the modal and renders one of four typed inline alerts (EXCLUDED with
a link, CONFLICT info, CARRIER_* warnings via friendlyMessage, or
VALIDATION_FAILED field-level invalid-feedback per spec Section 7.5).

A useEffect keyed on `show` resets both the local form state and the
Redux createStatus / createError slots when the modal closes (any of
X button, Cancel, Escape, or success). Reopening shows empty fields
and no error.
 */

import { useEffect, useState } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createPackage, fetchPackages, resetCreate } from '../../store/packagesSlice';
import { pushToast } from '../../store/uiSlice';
import { classifyTracking } from '../../lib/classifyTracking';
import { friendlyMessage } from '../../lib/friendlyMessage';

const CARRIER_OPTIONS = [
  { value: 'FEDEX', label: 'FedEx' },
  { value: 'UPS', label: 'UPS' },
  { value: 'USPS', label: 'USPS' },
];

function fieldErrorFor(error, fieldName) {
  if (!error || error.code !== 'VALIDATION_FAILED' || !Array.isArray(error.details)) return null;
  const match = error.details.find((d) => d.field === fieldName);
  return match ? match.message : null;
}

export default function AddPackageModal({ show, onClose }) {
  const dispatch = useDispatch();
  const createStatus = useSelector((s) => s.packages.createStatus);
  const createError = useSelector((s) => s.packages.createError);
  const submitting = createStatus === 'loading';

  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [nickname, setNickname] = useState('');
  const [userOverrodeCarrier, setUserOverrodeCarrier] = useState(false);

  // Reset on close: this fires once when `show` flips to false. Slice 4 decision D.
  useEffect(() => {
    if (!show) {
      setTrackingNumber('');
      setCarrier('');
      setNickname('');
      setUserOverrodeCarrier(false);
      dispatch(resetCreate());
    }
  }, [show, dispatch]);

  const handleTrackingBlur = () => {
    if (userOverrodeCarrier) return;
    const detected = classifyTracking(trackingNumber);
    if (detected) setCarrier(detected);
  };

  const handleCarrierChange = (e) => {
    setCarrier(e.target.value);
    setUserOverrodeCarrier(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalized = trackingNumber.trim().toUpperCase();
    const trimmedNickname = nickname.trim();
    const result = await dispatch(
      createPackage({
        tracking_number: normalized,
        carrier,
        nickname: trimmedNickname ? trimmedNickname : undefined,
      })
    );
    if (result.meta.requestStatus !== 'fulfilled') return;
    const pkg = result.payload;
    dispatch(
      pushToast({
        variant: 'success',
        message: `Added ${pkg.nickname || pkg.tracking_number}.`,
      })
    );
    onClose();
    dispatch(fetchPackages({ hidden: false }));
  };

  // Block all close paths while a dispatch is in flight, otherwise the X button
  // and Escape key fire onClose synchronously, the reset effect runs, and the
  // in-flight thunk's fulfilled handler then writes 'succeeded' onto a freshly
  // reset slice, producing a phantom toast + refetch for a closed modal. Cancel
  // is gated separately via its disabled prop. backdrop='static' already blocks
  // backdrop-click closes regardless of submit state.
  const handleHide = () => {
    if (submitting) return;
    onClose();
  };

  const trackingFieldError = fieldErrorFor(createError, 'tracking_number');
  const carrierFieldError = fieldErrorFor(createError, 'carrier');
  const nicknameFieldError = fieldErrorFor(createError, 'nickname');

  return (
    <Modal show={show} onHide={handleHide} backdrop="static" keyboard={!submitting} centered>
      <Modal.Header closeButton={!submitting}>
        <Modal.Title as="h2" className="h5 mb-0">
          Add package
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Body>
          {createError?.code === 'EXCLUDED' && (
            <Alert variant="warning" role="alert">
              This tracking number was previously excluded. Restore it from your Exclusions list to
              track it again.{' '}
              <Link to="/settings/exclusions" className="alert-link">
                Go to Exclusions
              </Link>
              .
            </Alert>
          )}
          {createError?.code === 'CONFLICT' && (
            <Alert variant="info" role="alert">
              You&apos;re already tracking this number.
            </Alert>
          )}
          {(createError?.code === 'CARRIER_API_UNAVAILABLE' ||
            createError?.code === 'CARRIER_NUMBER_NOT_FOUND') && (
            <Alert variant="warning" role="alert">
              {friendlyMessage(createError, { context: 'create' })}
            </Alert>
          )}

          <Form.Group className="mb-3" controlId="add-pkg-tracking">
            <Form.Label>Tracking number</Form.Label>
            <Form.Control
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onBlur={handleTrackingBlur}
              placeholder="e.g. 1Z999AA10123456784"
              required
              disabled={submitting}
              isInvalid={Boolean(trackingFieldError)}
              autoFocus
            />
            <Form.Control.Feedback type="invalid">{trackingFieldError}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="add-pkg-carrier">
            <Form.Label>Carrier</Form.Label>
            <Form.Select
              value={carrier}
              onChange={handleCarrierChange}
              required
              disabled={submitting}
              isInvalid={Boolean(carrierFieldError)}
            >
              <option value="">Select a carrier</option>
              {CARRIER_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{carrierFieldError}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-1" controlId="add-pkg-nickname">
            <Form.Label>Nickname</Form.Label>
            <Form.Control
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Optional - what is this package?"
              disabled={submitting}
              isInvalid={Boolean(nicknameFieldError)}
            />
            <Form.Control.Feedback type="invalid">{nicknameFieldError}</Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Adding...
              </>
            ) : (
              'Add package'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
