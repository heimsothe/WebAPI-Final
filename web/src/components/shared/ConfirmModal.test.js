/*
- File: ConfirmModal.test.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: ConfirmModal is the destructive-action confirmer. Tests
ensure it calls the right callback per button click, hides while show is
false, and renders the supplied title and body.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmModal from './ConfirmModal';

describe('ConfirmModal', () => {
  it('renders title, body, and the supplied confirm label when shown', () => {
    render(
      <ConfirmModal
        show
        title="Delete package?"
        body="This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText('Delete package?')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('renders nothing observable when show=false', () => {
    render(
      <ConfirmModal
        show={false}
        title="Delete package?"
        body="X"
        confirmText="Delete"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.queryByText('Delete package?')).not.toBeInTheDocument();
  });

  it('fires onConfirm when the confirm button is clicked', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const user = userEvent.setup();
    render(
      <ConfirmModal
        show
        title="Delete?"
        body="X"
        confirmText="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('fires onCancel when the cancel button is clicked', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const user = userEvent.setup();
    render(
      <ConfirmModal
        show
        title="Delete?"
        body="X"
        confirmText="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
