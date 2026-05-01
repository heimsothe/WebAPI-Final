/*
- File: renderWithProviders.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: RTL render helper that wraps the component under test in a
real Redux Provider and a MemoryRouter. Tests preload state for the
slices the component reads from. Returns RTL's render output plus a
preconfigured userEvent instance and the store reference.
 */

import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

// configureStore({ reducer: {} }) calls combineReducers({}) and warns. When the
// caller does not pass slices, fall through to a no-op identity reducer instead.
const identityReducer = (state = {}) => state;

export function renderWithProviders(ui, { preloadedState = {}, route = '/', reducer = {} } = {}) {
  const hasSlices = Object.keys(reducer).length > 0;
  const store = configureStore({
    reducer: hasSlices ? reducer : identityReducer,
    preloadedState,
  });

  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <MemoryRouter
          initialEntries={[route]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          {children}
        </MemoryRouter>
      </Provider>
    );
  }

  return {
    store,
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper }),
  };
}
