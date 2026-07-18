import { describe, expect, it } from 'vitest';
import { templateInstantiationContract, workspaceSettingsSchemaContract } from './productivity-api-contract';
describe('productivity API contract', () => { it('excludes historical data and arbitrary settings', () => { expect(templateInstantiationContract.excluded).toContain('attachments'); expect(workspaceSettingsSchemaContract.preferenceKeys).not.toContain('secret'); }); });
