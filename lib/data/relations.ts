// PostgREST to-one relations are objects at runtime; generated types can infer
// arrays without a generated database schema. Support either shape explicitly.
export function oneRelation<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}
