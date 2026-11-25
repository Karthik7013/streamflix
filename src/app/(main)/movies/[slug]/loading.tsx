export default function MovieLoading() {
  return (
    <div className="fixed inset-0 bg-black select-none overflow-hidden overscroll-none">
      <PlayerSkeleton />
    </div>
  );
}
