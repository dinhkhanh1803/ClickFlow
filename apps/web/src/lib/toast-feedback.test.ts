import { describe, expect, it, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));
import { toast } from 'sonner';
import { notifyMockSignIn, notifyTaskCreation } from '@/lib/toast-feedback';

describe('toast feedback', () => {
  it('announces a mock task creation', () => {
    notifyTaskCreation();
    expect(toast.success).toHaveBeenCalledWith('Task creation is ready', { description: 'Connect this flow to the Phase 2 API to save tasks.' });
  });

  it('announces mock sign-in success', () => {
    notifyMockSignIn();
    expect(toast.success).toHaveBeenCalledWith('Signed in successfully', { description: 'Welcome back to ClickFlow.' });
  });
});