import { create } from 'zustand';

interface ExitConfirmState {
  isOpen: boolean;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
  openDialog: (onConfirm: () => void, onCancel?: () => void) => void;
  closeDialog: () => void;
}

export const useExitConfirmStore = create<ExitConfirmState>((set) => ({
  isOpen: false,
  onConfirm: null,
  onCancel: null,
  openDialog: (onConfirm, onCancel) => {
    set({ isOpen: true, onConfirm, onCancel: onCancel || null });
  },
  closeDialog: () => {
    set({ isOpen: false, onConfirm: null, onCancel: null });
  },
}));






