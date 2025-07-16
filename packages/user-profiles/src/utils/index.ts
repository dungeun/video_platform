export * from './validation';

/**
 * Sanitize user profile name by trimming whitespace
 */
export function sanitizeName(name: string): string {
  return name.trim();
}

/**
 * Sanitize user profile bio by trimming whitespace
 */
export function sanitizeBio(bio: string): string {
  return bio.trim();
}

/**
 * Generate profile picture placeholder URL
 */
export function generateProfilePlaceholder(name: string): string {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random`;
}

/**
 * Validate image file format
 */
export function isValidImageFormat(filename: string, allowedFormats: string[] = ['jpg', 'jpeg', 'png', 'gif', 'webp']): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedFormats.includes(extension) : false;
}