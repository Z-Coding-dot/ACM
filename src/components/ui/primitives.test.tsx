import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import { ConfirmDialog, Dialog, ErrorState, Loading, EmptyState } from './primitives';
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
  it('follows the visible viewport and restores page scrolling and trigger focus on close', () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'visualViewport');
    const viewport = Object.assign(new EventTarget(), { height: 700, offsetTop: 0 });
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
    const trigger = document.createElement('button'); document.body.append(trigger); trigger.focus();
    const originalBodyOverflow = document.body.style.overflow, originalRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'scroll';
    try {
      const { unmount } = render(<Dialog title="Account menu" footer={<button>Sign out</button>} onClose={() => {}}><p>Account links</p></Dialog>);
      const dialog = screen.getByRole('dialog');
      expect(document.body.style.overflow).toBe('hidden');
      viewport.height = 300; viewport.offsetTop = 40; viewport.dispatchEvent(new Event('resize'));
      expect(dialog.style.getPropertyValue('--dialog-viewport-height')).toBe('300px');
      expect(dialog.style.getPropertyValue('--dialog-viewport-top')).toBe('40px');
      expect(screen.getByRole('button', { name: 'Sign out' }).closest('.dialog-body')).toBeNull();
      unmount();
      expect(document.body.style.overflow).toBe('scroll');
      expect(document.documentElement.style.overflow).toBe(originalRootOverflow);
      expect(trigger).toHaveFocus();
    } finally {
      document.body.style.overflow = originalBodyOverflow; document.documentElement.style.overflow = originalRootOverflow;
      trigger.remove();
      if (descriptor) Object.defineProperty(window, 'visualViewport', descriptor); else Reflect.deleteProperty(window, 'visualViewport');
    }
  });
});
