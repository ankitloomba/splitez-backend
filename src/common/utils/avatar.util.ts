/**
 * Deterministic initials-avatar generation.
 * Blueprint §9: until a user uploads a photo, show a clean initials avatar
 * (e.g. "AL" for Ankit Loomba). The result must be deterministic per user.
 */

const PALETTE = [
  '#F26D6D', '#F2A65A', '#F2CB6D', '#7FBF7F', '#5AB1BB',
  '#5A8DEE', '#8A79E0', '#C471B9', '#E06377', '#6C8EBF',
];

export function initials(firstName: string, lastName?: string | null): string {
  const a = (firstName ?? '').trim().charAt(0).toUpperCase();
  const b = (lastName ?? '').trim().charAt(0).toUpperCase();
  return (a + b) || a || '?';
}

/** Stable colour derived from a seed (e.g. the user id) so it never changes. */
export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function initialAvatar(
  seed: string,
  firstName: string,
  lastName?: string | null,
) {
  return {
    initials: initials(firstName, lastName),
    backgroundColor: avatarColor(seed),
  };
}
