import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '@/lib/auth'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  type: 'business' | 'influencer'
}

class AuthServiceClass {
  private JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
  private REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string; refreshToken: string }> {
    const { email, password } = credentials

    // Mock user data - in real app, this would come from database
    const mockUser: User = {
      id: '1',
      email,
      name: 'Mock User',
      type: 'business',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Mock password verification - in real app, this would verify against hashed password
    const isValidPassword = await bcrypt.compare(password, await bcrypt.hash('password123', 10))
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials')
    }

    const token = jwt.sign(
      { userId: mockUser.id, email: mockUser.email, type: mockUser.type },
      this.JWT_SECRET,
      { expiresIn: '1h' }
    )

    const refreshToken = jwt.sign(
      { userId: mockUser.id },
      this.REFRESH_SECRET,
      { expiresIn: '7d' }
    )

    return { user: mockUser, token, refreshToken }
  }

  async register(data: RegisterData): Promise<{ user: User; token: string; refreshToken: string }> {
    const { email, password, name, type } = data

    // Mock user creation - in real app, this would save to database
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      type,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const token = jwt.sign(
      { userId: mockUser.id, email: mockUser.email, type: mockUser.type },
      this.JWT_SECRET,
      { expiresIn: '1h' }
    )

    const refreshToken = jwt.sign(
      { userId: mockUser.id },
      this.REFRESH_SECRET,
      { expiresIn: '7d' }
    )

    return { user: mockUser, token, refreshToken }
  }

  async refreshToken(token: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(token, this.REFRESH_SECRET) as any
      
      const newToken = jwt.sign(
        { userId: decoded.userId },
        this.JWT_SECRET,
        { expiresIn: '1h' }
      )

      const newRefreshToken = jwt.sign(
        { userId: decoded.userId },
        this.REFRESH_SECRET,
        { expiresIn: '7d' }
      )

      return { token: newToken, refreshToken: newRefreshToken }
    } catch (error) {
      throw new Error('Invalid refresh token')
    }
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, this.JWT_SECRET)
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  async getUser(userId: string): Promise<User | null> {
    // Mock user retrieval - in real app, this would fetch from database
    return {
      id: userId,
      email: 'user@example.com',
      name: 'Mock User',
      type: 'business',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  async logout(sessionId: string): Promise<void> {
    // Mock logout - in real app, this would clear session from database/redis
    console.log('Logging out session:', sessionId)
  }

  async validateToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET)
      return decoded
    } catch (error) {
      return null
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.getUser(userId)
  }

  async refreshSession(refreshToken: string): Promise<any> {
    const result = await this.refreshToken(refreshToken)
    return {
      accessToken: result.token,
      refreshToken: result.refreshToken,
      user: { id: '1', email: 'user@example.com', name: 'User', type: 'business' }
    }
  }
}

export const authService = new AuthServiceClass()