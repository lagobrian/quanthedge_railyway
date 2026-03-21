// Utility function for combining class names (commonly used with Tailwind CSS)
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
