import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  type: 'business' | 'influencer'
  phone?: string
  address?: string
  companyName?: string
  businessNumber?: string
  businessFileUrl?: string | null
  businessFileName?: string | null
  businessFileSize?: number | null
}

class AuthServiceClass {
  private JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
  private REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string; refreshToken: string }> {
    const { email, password } = credentials

    try {
      // Find user in database
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          profile: true,
          businessProfile: true
        }
      })

      if (!user) {
        throw new Error('Invalid credentials')
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password)
      
      if (!isValidPassword) {
        throw new Error('Invalid credentials')
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      })

      const token = jwt.sign(
        { userId: user.id, email: user.email, type: user.type },
        this.JWT_SECRET,
        { expiresIn: '1h' }
      )

      const refreshToken = jwt.sign(
        { userId: user.id },
        this.REFRESH_SECRET,
        { expiresIn: '7d' }
      )

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          type: user.type as 'BUSINESS' | 'INFLUENCER' | 'ADMIN'
        },
        token,
        refreshToken
      }
    } catch (error) {
      console.error('Login error:', error)
      throw new Error('Invalid credentials')
    }
  }

  async register(data: RegisterData): Promise<{ user: User; token: string; refreshToken: string }> {
    const { 
      email, 
      password, 
      name, 
      type, 
      phone, 
      address, 
      companyName, 
      businessNumber,
      businessFileUrl,
      businessFileName,
      businessFileSize
    } = data

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        throw new Error('이미 등록된 이메일입니다.')
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)
      
      // Create user with profile
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          type: type.toUpperCase() as 'BUSINESS' | 'INFLUENCER',
          profile: type === 'influencer' ? {
            create: {
              phone,
              address
            }
          } : undefined,
          businessProfile: type === 'business' ? {
            create: {
              companyName: companyName || name,
              businessNumber: businessNumber || '',
              representativeName: name,
              businessAddress: address || '',
              businessCategory: '',
              businessRegistration: businessFileUrl,
              businessFileName: businessFileName,
              businessFileSize: businessFileSize
            }
          } : undefined
        },
        include: {
          profile: true,
          businessProfile: true
        }
      })

      const token = jwt.sign(
        { userId: user.id, email: user.email, type: user.type },
        this.JWT_SECRET,
        { expiresIn: '1h' }
      )

      const refreshToken = jwt.sign(
        { userId: user.id },
        this.REFRESH_SECRET,
        { expiresIn: '7d' }
      )

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          type: user.type as 'BUSINESS' | 'INFLUENCER'
        },
        token,
        refreshToken
      }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
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
      type: 'business'
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
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true
        }
      })
      
      if (!user) return null
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type as 'BUSINESS' | 'INFLUENCER' | 'ADMIN'
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      return null
    }
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