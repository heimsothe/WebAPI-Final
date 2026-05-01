/*
- File: App.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Top-level route tree. Slice 1 ships the route shape with
all 7 placeholder pages and NO auth wrappers; routes are unprotected
until Slice 2 adds RequireAuth and RedirectIfAuthed.
 */

import { Routes, Route } from 'react-router-dom';
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
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/" element={<DashboardPage />} />
      <Route path="/packages/:id" element={<PackageDetailPage />} />
      <Route path="/sync" element={<SyncPage />} />
      <Route path="/settings/*" element={<SettingsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
