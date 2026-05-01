/*
- File: RedirectIfAuthed.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Inverse of RequireAuth. Used to bounce a signed-in user
away from /signin and /signup so the auth pages are unreachable while
already authenticated.
 */

import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

export default function RedirectIfAuthed() {
  const token = useSelector((s) => s.user.token);
  if (token) return <Navigate to="/" replace />;
  return <Outlet />;
}
