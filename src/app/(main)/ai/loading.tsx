export default function AiLoading() {
  return (
    <div className="mx-auto flex h-[calc(100dvh-5rem)] max-w-xl flex-col overflow-hidden">
      <div className="p-8">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
        <p className="text-lg font-medium">Loading AI chat...</p>
      </div>
    </div>
  );
}
