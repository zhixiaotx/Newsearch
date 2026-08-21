/** Check if text is primarily English (more than 60% ASCII letters) */
export function isEnglish(text: string): boolean {
  if (!text) return false;
  const latin = (text.match(/[a-zA-Z]/g) || []).length;
  return latin / text.length > 0.6;
}
