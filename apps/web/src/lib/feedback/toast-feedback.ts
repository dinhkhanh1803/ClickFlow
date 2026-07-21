import { toast } from 'sonner';

export function notifyTaskCreation() {
  toast.success('Task creation is ready', { description: 'Connect this flow to the Phase 2 API to save tasks.' });
}

export function notifyToastPreview() {
  toast.success('ClickFlow notifications are working', { description: 'This is a safe preview toast.' });
}