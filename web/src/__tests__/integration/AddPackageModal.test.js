/*
- File: AddPackageModal.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Integration tests for the Add Package modal. Each case
mounts the modal directly with show=true and a captured onClose spy,
walks one user path, and asserts on the dispatched HTTP body
(captured from the MSW handler) plus the resulting Redux state.
The auto-detect, manual-override, success, EXCLUDED, CONFLICT,
VALIDATION_FAILED, CARRIER_API_UNAVAILABLE, and reset-on-close cases
are each their own test.

The modal is rendered in isolation rather than through DashboardPage
so each test has tight control over the form state and Redux preload
without re-running DashboardPage's mount-time fetchPackages.
 */

import { rest } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { server } from '../../test-utils/handlers/server';
import { makePackageDetail } from '../../test-utils/factories';
import packagesReducer from '../../store/packagesSlice';
import uiReducer from '../../store/uiSlice';
import userReducer from '../../store/userSlice';
import AddPackageModal from '../../components/packages/AddPackageModal';

const BASE = process.env.REACT_APP_API_BASE_URL;
const reducer = { user: userReducer, packages: packagesReducer, ui: uiReducer };

const signedInState = () => ({
  user: {
    user: { id: '1', email: 'me@example.com', display_name: 'Me', created_at: '' },
    token: 'tok',
    status: 'idle',
    error: null,
    justForceLoggedOut: false,
  },
  ui: { toasts: [] },
  packages: {
    items: [],
    hiddenItems: [],
    detail: null,
    listStatus: 'idle',
    listError: null,
    detailStatus: 'idle',
    detailError: null,
    createStatus: 'idle',
    createError: null,
    refreshingId: null,
  },
});

beforeEach(() => {
  localStorage.setItem('pkg_tracker_token', 'tok');
});

afterEach(() => {
  localStorage.clear();
});

describe('AddPackageModal', () => {
  it('renders empty when opened', () => {
    const onClose = jest.fn();
    renderWithProviders(<AddPackageModal show={true} onClose={onClose} />, {
      reducer,
      preloadedState: signedInState(),
    });
    expect(screen.getByRole('heading', { name: /add package/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/tracking number/i)).toHaveValue('');
    expect(screen.getByLabelText(/carrier/i)).toHaveValue('');
    expect(screen.getByLabelText(/nickname/i)).toHaveValue('');
  });

  it('auto-detects carrier on tracking-number blur (FedEx 12-digit)', async () => {
    const onClose = jest.fn();
    const { user } = renderWithProviders(<AddPackageModal show={true} onClose={onClose} />, {
      reducer,
      preloadedState: signedInState(),
    });
    const trackingInput = screen.getByLabelText(/tracking number/i);
    await user.type(trackingInput, '774988123312');
    // Tab out to trigger blur.
    await user.tab();
    expect(screen.getByLabelText(/carrier/i)).toHaveValue('FEDEX');
  });

  it('manual carrier change locks out auto-detect for the session', async () => {
    const onClose = jest.fn();
    const { user } = renderWithProviders(<AddPackageModal show={true} onClose={onClose} />, {
      reducer,
      preloadedState: signedInState(),
    });
    const trackingInput = screen.getByLabelText(/tracking number/i);
    const carrierSelect = screen.getByLabelText(/carrier/i);
    // First, user manually picks UPS.
    await user.selectOptions(carrierSelect, 'UPS');
    expect(carrierSelect).toHaveValue('UPS');
    // Now they paste a FedEx-shaped tracking number and tab out.
    await user.click(trackingInput);
    await user.type(trackingInput, '774988123312');
    await user.tab();
    // Carrier stays UPS (manual override wins).
    expect(carrierSelect).toHaveValue('UPS');
  });

  it('on successful submit, dispatches createPackage with normalized tracking number, pushes a success toast, calls onClose, and refetches the list', async () => {
    const onClose = jest.fn();
    let createBody;
    let listFetchCount = 0;
    server.use(
      rest.post(`${BASE}/api/packages`, async (req, res, ctx) => {
        createBody = await req.json();
        return res(
          ctx.status(201),
          ctx.json({
            success: true,
            data: makePackageDetail({
              id: '321',
              tracking_number: createBody.tracking_number,
              carrier: createBody.carrier,
              nickname: createBody.nickname ?? null,
              events: [],
            }),
          })
        );
      }),
      rest.get(`${BASE}/api/packages`, (req, res, ctx) => {
        listFetchCount += 1;
        return res(ctx.status(200), ctx.json({ success: true, data: [] }));
      })
    );

    const { user, store } = renderWithProviders(<AddPackageModal show={true} onClose={onClose} />, {
      reducer,
      preloadedState: signedInState(),
    });

    // User pastes a number with leading whitespace and lower case (Slice 4 decision E:
    // normalization happens at submit, not on every keystroke).
    await user.type(screen.getByLabelText(/tracking number/i), '  1z999aa10123456784  ');
    await user.tab(); // blur triggers auto-detect, carrier becomes UPS
    await user.type(screen.getByLabelText(/nickname/i), 'Mom');
    await user.click(screen.getByRole('button', { name: /^add package$/i }));

    await waitFor(() => expect(createBody).toBeDefined());
    expect(createBody).toEqual({
      tracking_number: '1Z999AA10123456784',
      carrier: 'UPS',
      nickname: 'Mom',
    });

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(listFetchCount).toBeGreaterThanOrEqual(1));

    const toast = store.getState().ui.toasts[0];
    expect(toast).toMatchObject({
      variant: 'success',
      message: 'Added Mom.',
    });
  });

  it('on success with no nickname, the toast falls back to the tracking number', async () => {
    const onClose = jest.fn();
    server.use(
      rest.post(`${BASE}/api/packages`, async (req, res, ctx) => {
        const body = await req.json();
        return res(
          ctx.status(201),
          ctx.json({
            success: true,
            data: makePackageDetail({
              id: '322',
              tracking_number: body.tracking_number,
              carrier: body.carrier,
              nickname: null,
              events: [],
            }),
          })
        );
      }),
      rest.get(`${BASE}/api/packages`, (req, res, ctx) =>
        res(ctx.status(200), ctx.json({ success: true, data: [] }))
      )
    );

    const { user, store } = renderWithProviders(<AddPackageModal show={true} onClose={onClose} />, {
      reducer,
      preloadedState: signedInState(),
    });

    await user.type(screen.getByLabelText(/tracking number/i), '774988123312');
    await user.tab();
    await user.click(screen.getByRole('button', { name: /^add package$/i }));

    await waitFor(() => expect(store.getState().ui.toasts).toHaveLength(1));
    expect(store.getState().ui.toasts[0]).toMatchObject({
      variant: 'success',
      message: 'Added 774988123312.',
    });
  });

  it('on EXCLUDED, shows the warning alert with a link to /settings/exclusions and preserves form values', async () => {
    const onClose = jest.fn();
    server.use(
      rest.post(`${BASE}/api/packages`, (req, res, ctx) =>
        res(
          ctx.status(409),
          ctx.json({
            success: false,
            error: {
              code: 'EXCLUDED',
              message:
                'This tracking number is on your exclusion list. Remove it from exclusions before re-adding.',
            },
          })
        )
      )
    );

    const { user } = renderWithProviders(<AddPackageModal show={true} onClose={onClose} />, {
      reducer,
      preloadedState: signedInState(),
    });
    await user.type(screen.getByLabelText(/tracking number/i), '774988123312');
    await user.tab();
    await user.click(screen.getByRole('button', { name: /^add package$/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/previously excluded/i);
    expect(within(alert).getByRole('link', { name: /go to exclusions/i })).toHaveAttribute(
      'href',
      '/settings/exclusions'
    );
    // Fields preserved.
    expect(screen.getByLabelText(/tracking number/i)).toHaveValue('774988123312');
    expect(screen.getByLabelText(/carrier/i)).toHaveValue('FEDEX');
    // Modal stays open.
    expect(onClose).not.toHaveBeenCalled();
  });

  it('on CONFLICT, shows an info alert with no link', async () => {
    const onClose = jest.fn();
    server.use(
      rest.post(`${BASE}/api/packages`, (req, res, ctx) =>
        res(
          ctx.status(409),
          ctx.json({
            success: false,
            error: { code: 'CONFLICT', message: 'You are already tracking this package.' },
          })
        )
      )
    );

    const { user } = renderWithProviders(<AddPackageModal show={true} onClose={onClose} />, {
      reducer,
      preloadedState: signedInState(),
    });
    await user.type(screen.getByLabelText(/tracking number/i), '774988123312');
    await user.tab();
    await user.click(screen.getByRole('button', { name: /^add package$/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/already tracking/i);
    expect(within(alert).queryByRole('link')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('on VALIDATION_FAILED, attaches invalid-feedback to the named field', async () => {
    const onClose = jest.fn();
    server.use(
      rest.post(`${BASE}/api/packages`, (req, res, ctx) =>
        res(
          ctx.status(422),
          ctx.json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Validation failed.',
              details: [
                {
                  field: 'tracking_number',
                  message: 'tracking_number must be 1 to 64 chars.',
                },
              ],
            },
          })
        )
      )
    );

    const { user } = renderWithProviders(<AddPackageModal show={true} onClose={onClose} />, {
      reducer,
      preloadedState: signedInState(),
    });
    await user.type(screen.getByLabelText(/tracking number/i), '774988123312');
    await user.tab();
    await user.click(screen.getByRole('button', { name: /^add package$/i }));

    await waitFor(() => {
      expect(screen.getByText(/tracking_number must be 1 to 64 chars/i)).toBeInTheDocument();
    });
    // Bootstrap renders invalid-feedback only when isInvalid is true on the control.
    expect(screen.getByLabelText(/tracking number/i)).toHaveClass('is-invalid');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('on CARRIER_API_UNAVAILABLE, shows the friendlyMessage create-context warning alert', async () => {
    const onClose = jest.fn();
    server.use(
      rest.post(`${BASE}/api/packages`, (req, res, ctx) =>
        res(
          ctx.status(503),
          ctx.json({
            success: false,
            error: {
              code: 'CARRIER_API_UNAVAILABLE',
              message: 'The carrier API is currently unreachable. Try again in a moment.',
            },
          })
        )
      )
    );

    const { user } = renderWithProviders(<AddPackageModal show={true} onClose={onClose} />, {
      reducer,
      preloadedState: signedInState(),
    });
    await user.type(screen.getByLabelText(/tracking number/i), '774988123312');
    await user.tab();
    await user.click(screen.getByRole('button', { name: /^add package$/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/couldn't reach the carrier to verify/i);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('reset on close: closing and reopening clears form state and any prior error', async () => {
    const onClose = jest.fn();
    server.use(
      rest.post(`${BASE}/api/packages`, (req, res, ctx) =>
        res(
          ctx.status(409),
          ctx.json({
            success: false,
            error: { code: 'CONFLICT', message: 'You are already tracking this package.' },
          })
        )
      )
    );

    const { user, rerender, store } = renderWithProviders(
      <AddPackageModal show={true} onClose={onClose} />,
      { reducer, preloadedState: signedInState() }
    );

    await user.type(screen.getByLabelText(/tracking number/i), '774988123312');
    await user.type(screen.getByLabelText(/nickname/i), 'Mom');
    await user.tab();
    await user.click(screen.getByRole('button', { name: /^add package$/i }));
    await screen.findByRole('alert');

    // Caller closes the modal (simulates Cancel click flowing up through onClose).
    rerender(<AddPackageModal show={false} onClose={onClose} />);
    // Then reopens.
    rerender(<AddPackageModal show={true} onClose={onClose} />);

    expect(screen.getByLabelText(/tracking number/i)).toHaveValue('');
    expect(screen.getByLabelText(/carrier/i)).toHaveValue('');
    expect(screen.getByLabelText(/nickname/i)).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    // Redux createStatus also reset.
    expect(store.getState().packages.createStatus).toBe('idle');
    expect(store.getState().packages.createError).toBeNull();
  });

  it('does not close while a submit is in flight (X button hidden, Escape blocked, Cancel disabled)', async () => {
    const onClose = jest.fn();
    // Preload createStatus='loading' directly rather than firing a real POST
    // and stalling the handler. The behavior under test is the modal's reaction
    // to the submitting flag (which is derived from createStatus), not the
    // round-trip itself. This avoids leaving a dangling fetch promise that
    // would otherwise prevent Jest from exiting cleanly.
    const preloaded = signedInState();
    preloaded.packages.createStatus = 'loading';
    const { user } = renderWithProviders(<AddPackageModal show={true} onClose={onClose} />, {
      reducer,
      preloadedState: preloaded,
    });

    // Cancel button is disabled.
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    // Modal X button (Bootstrap's btn-close) is gated off by closeButton={!submitting}.
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    // Escape key is a no-op (Modal keyboard={!submitting}).
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
    // Submit button shows the spinner.
    expect(screen.getByRole('button', { name: /adding/i })).toBeDisabled();
  });

  it('Cancel button calls onClose without dispatching createPackage', async () => {
    const onClose = jest.fn();
    let createCalled = false;
    server.use(
      rest.post(`${BASE}/api/packages`, (req, res, ctx) => {
        createCalled = true;
        return res(ctx.status(201), ctx.json({ success: true, data: makePackageDetail() }));
      })
    );

    const { user } = renderWithProviders(<AddPackageModal show={true} onClose={onClose} />, {
      reducer,
      preloadedState: signedInState(),
    });
    await user.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(createCalled).toBe(false);
  });
});
