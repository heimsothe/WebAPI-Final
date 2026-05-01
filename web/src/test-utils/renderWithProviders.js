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

export function renderWithProviders(ui, { preloadedState = {}, route = '/', reducer = {} } = {}) {
  const store = configureStore({
    reducer,
    preloadedState,
  });

  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Provider>
    );
  }

  return {
    store,
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper }),
  };
}
