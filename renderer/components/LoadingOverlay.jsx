export default function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-xl">
        <div className="w-8 h-8 border-4 border-tiktok-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
} 