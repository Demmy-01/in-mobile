/**
 * store/toastStore.ts
 * Global state store for interactive toasts and premium custom confirmation modals.
 */
import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  // Toast properties
  toastVisible: boolean;
  toastMessage: string;
  toastType: ToastType;
  toastTitle?: string;
  showToast: (message: string, type?: ToastType, title?: string) => void;
  hideToast: () => void;

  // Confirmation Modal properties
  confirmVisible: boolean;
  confirmTitle: string;
  confirmDescription: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
  showConfirm: (params: {
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  }) => void;
  hideConfirm: () => void;
}

let toastTimeout: any = null;

export const useToastStore = create<ToastState>((set) => ({
  // Toast initial state
  toastVisible: false,
  toastMessage: '',
  toastType: 'info',
  toastTitle: '',

  showToast: (message, type = 'info', title) => {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    set({
      toastVisible: true,
      toastMessage: message,
      toastType: type,
      toastTitle: title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info'),
    });

    toastTimeout = setTimeout(() => {
      set({ toastVisible: false });
    }, 3500);
  },

  hideToast: () => {
    if (toastTimeout) clearTimeout(toastTimeout);
    set({ toastVisible: false });
  },

  // Confirm Modal initial state
  confirmVisible: false,
  confirmTitle: '',
  confirmDescription: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  onConfirm: null,
  onCancel: null,

  showConfirm: ({ title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }) => {
    set({
      confirmVisible: true,
      confirmTitle: title,
      confirmDescription: description,
      confirmLabel,
      cancelLabel,
      onConfirm: () => {
        onConfirm();
        set({ confirmVisible: false });
      },
      onCancel: () => {
        if (onCancel) onCancel();
        set({ confirmVisible: false });
      },
    });
  },

  hideConfirm: () => {
    set({ confirmVisible: false });
  },
}));
