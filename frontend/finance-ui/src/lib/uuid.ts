/**
 * A random v4 UUID that works on plain http too.
 *
 * `crypto.randomUUID()` only exists in a secure context (https or localhost). Opening the dev
 * server from a phone over the LAN (http://192.168.x.x:5173) is not one, so it is undefined
 * there and every Save threw "crypto.randomUUID is not a function". `crypto.getRandomValues`
 * has no such restriction, so the fallback builds the same RFC 4122 v4 shape from it.
 */
export function randomUuid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6]! & 0x0f) | 0x40; // version 4
  b[8] = (b[8]! & 0x3f) | 0x80; // variant 10xx
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
