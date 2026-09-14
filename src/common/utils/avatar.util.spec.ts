import { initials, avatarColor, initialAvatar } from './avatar.util';

describe('avatar.util', () => {
  it('builds initials from first and last name', () => {
    expect(initials('Ankit', 'Loomba')).toBe('AL');
  });

  it('handles missing last name', () => {
    expect(initials('Ankit')).toBe('A');
    expect(initials('Ankit', null)).toBe('A');
  });

  it('falls back to ? for empty name', () => {
    expect(initials('')).toBe('?');
  });

  it('produces a deterministic colour for the same seed', () => {
    expect(avatarColor('user-123')).toBe(avatarColor('user-123'));
  });

  it('returns a full avatar descriptor', () => {
    const a = initialAvatar('seed-1', 'Ankit', 'Loomba');
    expect(a.initials).toBe('AL');
    expect(a.backgroundColor).toMatch(/^#[0-9A-F]{6}$/i);
  });
});
