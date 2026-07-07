import { useEffect } from "react";
import { ToastMessage } from "../types";
import { TOAST_TIMEOUT } from "../constants/config";

interface ToastProps {
  messages: ToastMessage[];
  onRemove: (id: string) => void;
}

export default function Toast({ messages, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50 pointer-events-none">
      {messages.map((msg) => (
        <ToastItem
          key={msg.id}
          message={msg}
          onRemove={() => onRemove(msg.id)}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  message: ToastMessage;
  onRemove: () => void;
}

function ToastItem({ message, onRemove }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(onRemove, TOAST_TIMEOUT);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const bgColor =
    message.type === "milestone" ? "bg-blue-600" : "bg-green-600";
  const icon =
    message.type === "milestone" ? (
      <svg
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ) : (
      <svg
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    );

  return (
    <div
      className={`${bgColor} text-white rounded-lg shadow-lg p-4 flex items-start gap-3 pointer-events-auto max-w-sm animate-fade-in`}
    >
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{message.title}</p>
        <p className="text-sm opacity-90">{message.message}</p>
      </div>
      <button
        onClick={onRemove}
        className="flex-shrink-0 ml-2 inline-flex text-white hover:opacity-75 transition-opacity"
      >
        <svg
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
