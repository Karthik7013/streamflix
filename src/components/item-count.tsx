interface ItemCountProps {
  from: number;
  to: number;
  total: number;
}

export function ItemCount({ from, to, total }: ItemCountProps) {
  return (
    <p className="text-sm text-muted-foreground">
      Showing {from}–{to} of {total} items
    </p>
  );
}
