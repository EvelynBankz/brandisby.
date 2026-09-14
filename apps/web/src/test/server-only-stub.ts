// Vitest runs are always server-side Node execution, so the real
// `server-only` package's client-bundle guard is a false positive here —
// aliased to this no-op in vitest.config.mts.
export {};
