import * as React from 'react';
import type { ToastActionElement, ToastProps } from './toast';

export interface ToasterToast extends Omit<ToastProps, 'title'> {
  id: string;
  title?: string;
  description?: string;
  action?: ToastActionElement;
}

declare function useToast(): {
  toast: (props: Omit<ToasterToast, 'id'>) => void;
  dismiss: (toastId?: string) => void;
  toasts: ToasterToast[];
};

declare const toast: (props: Omit<ToasterToast, 'id'>) => void;

export { useToast, toast, type ToastActionElement, type ToastProps };
