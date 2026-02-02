export function parseIntParam(value: unknown, radix = 10): number | null {
  const s = String(value ?? '');
  const n = parseInt(s, radix);
  return Number.isNaN(n) ? null : n;
}

export function parseFloatParam(value: unknown): number | null {
  const s = String(value ?? '');
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

export function toStringParam(value: unknown): string {
  return String(value ?? '');
}
