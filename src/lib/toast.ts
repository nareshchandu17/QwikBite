import { toast } from 'react-hot-toast';

export const showSuccessToast = (message: string) => {
  toast.success(message, {
    position: 'top-center',
    duration: 3000,
    style: {
      background: '#10B981',
      color: '#fff',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10B981',
    },
  });
};

export const showErrorToast = (message: string) => {
  toast.error(message, {
    position: 'top-center',
    duration: 3000,
    style: {
      background: '#EF4444',
      color: '#fff',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#EF4444',
    },
  });
};

export const showLoadingToast = (message: string) => {
  return toast.loading(message, {
    position: 'top-center',
    style: {
      background: '#3B82F6',
      color: '#fff',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  });
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};
