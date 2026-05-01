/*
- File: index.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: SPA entry point. Wires Provider, BrowserRouter, and the
api/client onUnauthorized hook so a 401 from any authenticated request
clears the user slice in one place. The setApiHandlers indirection
avoids the circular import between client.js and the store.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { setApiHandlers } from './api/client';
import { store } from './store';
import { forceLogout } from './store/userSlice';
import './styles/custom.scss';

setApiHandlers({ onUnauthorized: () => store.dispatch(forceLogout()) });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
