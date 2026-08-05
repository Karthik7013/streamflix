export function skeletonItems(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i);
}