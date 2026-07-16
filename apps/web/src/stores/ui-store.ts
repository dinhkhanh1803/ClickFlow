import { create } from 'zustand';
type UiState={isCreateTaskOpen:boolean;openCreateTask:()=>void;closeCreateTask:()=>void};
export const useUiStore=create<UiState>((set)=>({
  isCreateTaskOpen:false,
  openCreateTask:()=>set({isCreateTaskOpen:true}),
  closeCreateTask:()=>set({isCreateTaskOpen:false}),
}));
