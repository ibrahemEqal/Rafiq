export const CATALOG_PAGE_SIZE = 200;

// Used only for a single parent/code. Never silently truncate at PostgREST's
// default row limit, and never fetch the complete university into a dropdown.
export async function readCatalogPages<T>(read: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += CATALOG_PAGE_SIZE) {
    const result = await read(offset, offset + CATALOG_PAGE_SIZE - 1);
    if (result.error) throw new Error("Academic catalog unavailable");
    const page = result.data ?? [];
    rows.push(...page);
    if (page.length < CATALOG_PAGE_SIZE) return rows;
  }
}
