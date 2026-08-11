/**
 * Small deterministic PRNG so mock datasets are stable across server
 * renders and app restarts (no hydration drift, no flaky demo numbers).
 */
export function createSeededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}
