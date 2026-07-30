export const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];

function isLightColor(hex: string): boolean {
  const c = parseInt(hex.slice(1), 16);
  const lum = (0.299 * ((c >> 16) & 0xff) + 0.587 * ((c >> 8) & 0xff) + 0.114 * (c & 0xff)) / 255;
  return lum > 0.55;
}

export function getInitialsAvatar(name: string = '?'): string {
  const initials = name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
  const colorIndex = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const bg = AVATAR_COLORS[colorIndex];
  const textColor = isLightColor(bg) ? '#1f2937' : 'white';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="16" fill="${bg}"/><text x="50" y="50" text-anchor="middle" dominant-baseline="central" fill="${textColor}" font-family="system-ui" font-weight="700" font-size="40">${initials}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
