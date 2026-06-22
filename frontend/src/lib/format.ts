export const shortAddr = (a: string): string =>
  a && a.length > 12 ? `${a.slice(0, 6)}\u2026${a.slice(-4)}` : a;

export function winnerLabel(v: string): string {
  switch ((v || '').toUpperCase()) {
    case 'OPPONENT':
      return 'Opponent';
    case 'PROPONENT':
      return 'Proponent';
    default:
      return 'Unbroken';
  }
}

export function resultLabel(v: string): string {
  switch ((v || '').toUpperCase()) {
    case 'OVERTHROW':
      return 'Overthrown';
    case 'DEFEND':
      return 'Defended';
    default:
      return v || '';
  }
}

export function defenseWord(defenses: number): string {
  return defenses === 1 ? '1 defense' : `${defenses} defenses`;
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

export function clampLen(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}\u2026` : s;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
