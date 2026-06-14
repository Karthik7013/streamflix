export const BLOCKED_EXTENSIONS = new Set([
  ".exe", ".msi", ".bat", ".cmd", ".com", ".scr", ".pif",
  ".js", ".html", ".htm", ".xhtml", ".php", ".asp", ".aspx", ".jsp",
  ".sh", ".bash", ".vbs", ".ps1", ".psm1",
  ".jar", ".war",
  ".dmg", ".app", ".deb", ".rpm",
]);

export function isExtensionBlocked(fileName: string): boolean {
  const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
  return BLOCKED_EXTENSIONS.has(ext);
}
