/** Strip newline/carriage-return chars to prevent log injection (CWE-117) */
export function sanitizeLog(value: unknown): string {
  return String(value).replace(/[\r\n]/g, " ");
}
