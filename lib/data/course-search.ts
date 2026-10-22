// PostgREST's .or() uses punctuation as filter syntax. Search terms are data,
// not filters; remove delimiters and LIKE wildcards before constructing it.
export function courseSearchTerm(value: unknown) {
  return typeof value === "string"
    ? value.trim().slice(0, 80).replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim()
    : "";
}

export function courseSearchFilter(value: unknown) {
  const term = courseSearchTerm(value);
  if (term.length < 2) return null;
  return `name_ar.ilike.%${term}%,name_en.ilike.%${term}%,code.ilike.%${term}%`;
}
