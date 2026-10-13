import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import { ConfirmDialog, ErrorState, Loading, EmptyState } from './primitives';
import { ApiError } from '../../services/errors';
describe('feedback and destructive confirmation', () => {
  it('renders translated loading, empty, and retryable error states', async () => {
    await i18n.changeLanguage('en'); const retry = vi.fn(); const user = userEvent.setup(); render(<><Loading /><EmptyState /><ErrorState error={new ApiError('error.conflict', 409)} retry={retry} /></>);
    expect(screen.getByRole('status')).toHaveTextContent('Loading'); expect(screen.getByRole('heading')).toHaveTextContent('Nothing here yet'); await user.click(screen.getByRole('button', { name: 'Try again' })); expect(retry).toHaveBeenCalledOnce();
  });
  it('only calls a destructive action after explicit confirmation', async () => {
    await i18n.changeLanguage('en'); const onConfirm = vi.fn(), onClose = vi.fn(); const user = userEvent.setup(); render(<ConfirmDialog title="Cancel this appointment?" description="Confirm cancellation" action="Cancel appointment" onConfirm={onConfirm} onClose={onClose} />);
    expect(onConfirm).not.toHaveBeenCalled(); await user.click(screen.getByRole('button', { name: 'Cancel' })); expect(onClose).toHaveBeenCalledOnce(); expect(onConfirm).not.toHaveBeenCalled(); await user.click(screen.getByRole('button', { name: 'Cancel appointment' })); expect(onConfirm).toHaveBeenCalledOnce();
  });
});
