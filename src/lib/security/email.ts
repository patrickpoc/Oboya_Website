const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function isValidEmail(value: string): boolean {
  if (!value || value.length > 254) return false;
  if (/\s/.test(value) || /[<>]/.test(value)) return false;
  return EMAIL_RE.test(value);
}
