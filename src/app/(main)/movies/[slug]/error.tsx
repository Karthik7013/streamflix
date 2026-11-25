export default function MovieError() {
  return (
    <div className="fixed inset-0 bg-black select-none overflow-hidden overscroll-none">
      <div className="flex items-center justify-center h-full text-white">
        <p className="text-lg font-medium">Movie not found.</p>
        <button
          onClick={() => window.history.back()}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
