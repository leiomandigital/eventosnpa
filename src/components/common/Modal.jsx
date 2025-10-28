import React from "react";

const Modal = ({
  isOpen,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = null,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) {
    return null;
  }

  const renderMessage = () => {
    if (React.isValidElement(message)) {
      return message;
    }
    return <>{message}</>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        {title && <h2 className="text-lg font-semibold text-sky-600 mb-3">{title}</h2>}
        <div className="text-sm text-gray-600 whitespace-pre-line mb-6">{renderMessage()}</div>
        <div className="flex justify-end space-x-3">
          {cancelLabel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              type="button"
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition"
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
