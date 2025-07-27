import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function getServerSession() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token');
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET || 'your-secret-key') as any;
    return {
      user: {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        type: decoded.type
      }
    };
  } catch (error) {
    return null;
  }
}