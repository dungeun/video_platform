import jwt from 'jsonwebtoken';

interface JWTPayload {
  id: string;
  userId: string;
  email: string;
  type: string;
}

interface RefreshPayload {
  id: string;
}

export async function signJWT(
  payload: JWTPayload | RefreshPayload,
  options?: jwt.SignOptions
): Promise<string> {
  const secret = 'expiresIn' in (options || {}) && options?.expiresIn === '7d'
    ? process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-jwt-key-change-this-in-production'
    : process.env.JWT_SECRET || 'your-secret-key';

  // Ensure userId is set for JWTPayload
  if ('email' in payload && !('userId' in payload)) {
    (payload as any).userId = (payload as any).id;
  }

  return jwt.sign(payload, secret, options);
}

export async function verifyJWT(
  token: string,
  isRefreshToken = false
): Promise<JWTPayload> {
  const secret = isRefreshToken
    ? process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-jwt-key-change-this-in-production'
    : process.env.JWT_SECRET || 'your-secret-key';

  return jwt.verify(token, secret) as JWTPayload;
}

export function getTokenFromHeader(authHeader?: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
}