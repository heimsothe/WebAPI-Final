/*
- File: App.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Top-level route tree. Slice 2 introduces auth wrappers:
public routes go through RedirectIfAuthed; protected routes go through
RequireAuth followed by AppShell. The placeholder pages for Dashboard,
PackageDetail, Sync, and Settings remain (Slices 3-6 replace them).
 */

import { Routes, Route } from 'react-router-dom';
import RequireAuth from './components/auth/RequireAuth';
import RedirectIfAuthed from './components/auth/RedirectIfAuthed';
import AppShell from './components/Layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import PackageDetailPage from './pages/PackageDetailPage';
import SyncPage from './pages/SyncPage';
import SettingsPage from './pages/SettingsPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<RedirectIfAuthed />}>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/packages/:id" element={<PackageDetailPage />} />
          <Route path="/sync" element={<SyncPage />} />
          <Route path="/settings/*" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
