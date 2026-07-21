import { describe, expect, it, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));
import { toast } from 'sonner';
import { notifyTaskCreation, notifyToastPreview } from '@/lib/feedback/toast-feedback';

describe('toast feedback', () => {
  it('announces a mock task creation', () => {
    notifyTaskCreation();
    expect(toast.success).toHaveBeenCalledWith('Task creation is ready', { description: 'Connect this flow to the Phase 2 API to save tasks.' });
  });

  it('announces a preview toast', () => {
    notifyToastPreview();
    expect(toast.success).toHaveBeenCalledWith('ClickFlow notifications are working', { description: 'This is a safe preview toast.' });
  });
});