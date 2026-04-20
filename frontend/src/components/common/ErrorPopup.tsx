
interface ErrorPopupProps {
    message:string;
    onClose : ()=>void;
}

const ErrorPopup = ({ message, onClose }: ErrorPopupProps) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[120]">
      <div className="absolute inset-0 z-0 bg-black/50" onClick={onClose} />
      <div
        className="relative z-10 bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
        <p className="text-gray-700 mb-4">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ErrorPopup;
