import { describe, expect, it } from 'vitest';
import { attachmentPolicyContract } from './attachment-api-contract';
describe('attachment API contract', () => { it('keeps URLs short-lived and storage keys workspace scoped', () => { expect(attachmentPolicyContract.downloadUrlTtlSeconds).toBeLessThanOrEqual(300); expect(attachmentPolicyContract.storageKeyPattern).toContain('{workspaceId}'); }); });
