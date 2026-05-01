/*
- File: RequireAuth.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Route-level gate for authenticated views. When the user
slice has no token, redirects to /signin while passing the original
location in router state so signin can return the user to where they
tried to go.
 */

import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function RequireAuth() {
  const token = useSelector((s) => s.user.token);
  const location = useLocation();
  if (!token) return <Navigate to="/signin" replace state={{ from: location }} />;
  return <Outlet />;
}
