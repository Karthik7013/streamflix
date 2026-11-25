export default function AiError() {
  return (
    <div className="mx-auto flex h-[calc(100dvh-5rem)] max-w-xl flex-col overflow-hidden">
      <p className="text-xl font-medium mb-2">Unable to load AI page.</p>
      <button
        onClick={() => window.history.back()}
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
      >
        Go Back
      </button>
    </div>
  );
}
