export default function ExploreError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <p className="text-xl font-medium mb-2">Unable to load explore page.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
