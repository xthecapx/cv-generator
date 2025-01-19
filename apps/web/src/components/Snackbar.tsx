import { useEffect } from 'react';

interface SnackbarProps {
  message: string;
  isVisible: boolean;
  onHide: () => void;
}

export function Snackbar({ message, isVisible, onHide }: SnackbarProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onHide, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg">
        {message}
      </div>
    </div>
  );
} 