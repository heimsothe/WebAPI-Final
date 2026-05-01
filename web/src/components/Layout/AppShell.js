/*
- File: AppShell.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Chrome wrapper for protected routes. NavBar above an Outlet,
ToastContainer at top-end. Slice 3 connects the container to state.ui.toasts;
each toast renders a Bootstrap Toast with optional Undo action button. The
auto-dismiss is implemented per Toast via Bootstrap's autohide + delay.
 */

import { Container, Toast, ToastContainer, Button } from 'react-bootstrap';
import { Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import NavBar from './NavBar';
import { dismissToast } from '../../store/uiSlice';

export default function AppShell() {
  const toasts = useSelector((s) => s.ui?.toasts ?? []);
  const dispatch = useDispatch();

  return (
    <>
      <NavBar />
      <Container className="py-4">
        <Outlet />
      </Container>
      <ToastContainer position="top-end" className="p-3" containerPosition="fixed">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            bg={t.variant}
            onClose={() => dispatch(dismissToast(t.id))}
            show
            delay={t.autoDismissMs}
            autohide
          >
            <Toast.Header>
              <strong className="me-auto">Notification</strong>
            </Toast.Header>
            <Toast.Body className={t.variant === 'light' ? '' : 'text-white'}>
              {t.message}
              {t.action ? (
                <Button
                  variant="link"
                  size="sm"
                  className="ms-2 p-0 align-baseline text-white"
                  onClick={() => {
                    t.action.onClick();
                    dispatch(dismissToast(t.id));
                  }}
                >
                  {t.action.label}
                </Button>
              ) : null}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </>
  );
}
