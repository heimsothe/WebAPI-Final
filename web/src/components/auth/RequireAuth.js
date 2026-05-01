/*
- File: RequireAuth.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Route-level gate for authenticated views. When the user
slice has no token, redirects to /signin while passing the original
location in router state. If the lack of token comes from a forced
logout (justForceLoggedOut flag set by the api/client.js 401 hook),
adds ?expired=1 so SignInPage can show the blue notice. The flag is
NOT cleared from this component: doing so would synchronously re-
render RequireAuth (via useSyncExternalStore in useSelector) before
Navigate commits the URL change, causing the second render to fire
a second Navigate without ?expired=1 and overwrite the first one.
The flag self-clears on signin.pending, signup.pending, and logout,
which covers every real-world recovery path.
 */

import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function RequireAuth() {
  const token = useSelector((s) => s.user.token);
  const justForceLoggedOut = useSelector((s) => s.user.justForceLoggedOut);
  const location = useLocation();

  if (!token) {
    const target = justForceLoggedOut
      ? { pathname: '/signin', search: '?expired=1' }
      : { pathname: '/signin' };
    return <Navigate to={target} replace state={{ from: location }} />;
  }
  return <Outlet />;
}
