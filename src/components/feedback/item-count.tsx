interface ItemCountProps {
  page: number;
  limit: number;
  total: number;
}

export function ItemCount({ page, limit, total }: ItemCountProps) {
  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No items
      </p>
    );
  }
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <p className="text-sm text-muted-foreground">
      Showing {from}–{to} of {total} items
    </p>
  );
}
