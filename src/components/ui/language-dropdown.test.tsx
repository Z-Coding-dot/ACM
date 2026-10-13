import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import { LanguageDropdown } from './language-dropdown';
describe('accessible language switching', () => {
  beforeEach(async () => { await i18n.changeLanguage('en'); });
  it('supports keyboard selection, updates document direction, and returns focus', async () => {
    const user = userEvent.setup(); render(<LanguageDropdown />);
    const trigger = screen.getByRole('button', { name: 'Change language' }); trigger.focus();
    await user.keyboard('{ArrowDown}'); await user.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));
    expect(document.documentElement.lang).toBe('fa-AF'); expect(trigger).toHaveFocus(); await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });
  it('dismisses with Escape and outside clicks', async () => {
    const user = userEvent.setup(); render(<><LanguageDropdown /><button>Outside</button></>);
    await user.click(screen.getByRole('button', { name: 'Change language' })); await user.keyboard('{Escape}'); await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Change language' })); await user.click(screen.getByRole('button', { name: 'Outside' })); await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });
});
