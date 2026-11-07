/** Extract QR token from kiosk display, deep link, or raw paste. */
export function parseQrTokenInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const tokenFromQuery = trimmed.match(/[?&]token=([^&]+)/i);
  if (tokenFromQuery) {
    return decodeURIComponent(tokenFromQuery[1]);
  }

  if (trimmed.startsWith('tp://') || trimmed.startsWith('tp:')) {
    try {
      const normalized = trimmed.replace(/^tp:\/\//, 'https://tp.local/');
      const url = new URL(normalized);
      const token = url.searchParams.get('token');
      if (token) return token;
    } catch {
      /* fall through */
    }
  }

  return trimmed;
}
