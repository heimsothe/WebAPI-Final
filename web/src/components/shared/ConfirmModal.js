/*
- File: ConfirmModal.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Destructive-action confirmation. Two buttons: Cancel (secondary)
and the supplied confirmText (danger). The caller controls the show prop and
provides onConfirm + onCancel. Defaults assume a Delete-style flow.
 */

import { Modal, Button } from 'react-bootstrap';

export default function ConfirmModal({
  show,
  title,
  body,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmVariant = 'danger',
}) {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          {cancelText}
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm}>
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
