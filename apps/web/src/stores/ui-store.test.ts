import { describe, expect, it } from 'vitest';
import { useUiStore } from '@/stores/ui-store';

describe('ui store',()=>{it('toggles the create-task dialog state',()=>{useUiStore.setState({isCreateTaskOpen:false}); useUiStore.getState().openCreateTask(); expect(useUiStore.getState().isCreateTaskOpen).toBe(true);});});
