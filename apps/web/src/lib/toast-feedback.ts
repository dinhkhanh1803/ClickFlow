import { toast } from 'sonner';

export function notifyTaskCreation() {
  toast.success('Task creation is ready', { description: 'Connect this flow to the Phase 2 API to save tasks.' });
}

export function notifyMockSignIn() {
  toast.success('Signed in successfully', { description: 'Welcome back to ClickFlow.' });
}