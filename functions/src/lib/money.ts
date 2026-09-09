/** Money helpers — store and compute in integer centavos. */

export function toCents(reais: number): number {
  if (!Number.isFinite(reais)) {
    throw new Error("Invalid money value");
  }
  return Math.round(reais * 100);
}

export function fromCents(cents: number): number {
  if (!Number.isFinite(cents)) {
    throw new Error("Invalid cents value");
  }
  return Math.round(cents) / 100;
}

export function assertCents(cents: number): number {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new Error(`Expected non-negative integer cents, got ${cents}`);
  }
  return cents;
}

export function addCents(...parts: number[]): number {
  return parts.reduce((sum, part) => sum + assertCents(part), 0);
}

export function subtractCents(left: number, right: number): number {
  const result = assertCents(left) - assertCents(right);
  if (result < 0) {
    throw new Error("Money result cannot be negative");
  }
  return result;
}
