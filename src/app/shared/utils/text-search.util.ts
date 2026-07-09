export function matchesSearchQuery(value: string, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return value.toLowerCase().includes(normalized);
}
