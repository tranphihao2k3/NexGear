// Simple toast utility to replace react-hot-toast
// This provides a compatible interface without the external library

export const toast = {
  success: (message: string) => {
    console.log('✅ Success:', message);
    if (typeof window !== 'undefined') {
      // Try to show a simple alert or use the browser's notification
      // In production, this would be replaced with proper toast notifications
    }
  },
  error: (message: string) => {
    console.error('❌ Error:', message);
    if (typeof window !== 'undefined') {
      // In production, show error toast
    }
  },
  loading: (message: string) => {
    console.log('⏳ Loading:', message);
  },
  promise: (promise: Promise<any>, messages: any) => {
    console.log('Promise:', messages);
    return promise;
  }
};

export const Toaster = () => null; // Placeholder
