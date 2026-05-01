/*
- File: AppShell.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Chrome wrapper for protected routes. Mounts the navbar
above an Outlet so each protected page renders inside the same shell.
ToastContainer mount lives here too even though Slice 2 has no toasts;
later slices feed it via uiSlice.
 */

import { Container, ToastContainer } from 'react-bootstrap';
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';

export default function AppShell() {
  return (
    <>
      <NavBar />
      <Container className="py-4">
        <Outlet />
      </Container>
      <ToastContainer position="top-end" className="p-3" />
    </>
  );
}
