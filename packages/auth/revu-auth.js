/**
 * Revu Platform Authentication Module
 * Extends auth-jwt module for business-influencer platform
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

class RevuAuthModule {
  constructor(config) {
    this.config = config;
    this.jwtSecret = config.jwtSecret;
    this.googleClient = new OAuth2Client(config.google.clientId);
    this.socialPlatforms = {
      instagram: config.instagram,
      youtube: config.youtube,
      tiktok: config.tiktok
    };
  }

  // 기본 인증 기능
  async register(userData) {
    try {
      const { email, password, type, profile } = userData;
      
      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // 사용자 생성
      const user = {
        email,
        password: hashedPassword,
        type, // 'business' 또는 'influencer'
        profile,
        verified: false,
        createdAt: new Date(),
        permissions: this.getDefaultPermissions(type)
      };

      // 이벤트 발행
      this.emit('user.registered', { user, type });

      // 토큰 생성
      const tokens = this.generateTokenPair(user);

      return {
        user: this.sanitizeUser(user),
        tokens,
        isFirstLogin: true
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  async login(credentials) {
    try {
      const { email, password } = credentials;
      
      // 사용자 조회 (실제로는 DB에서)
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // 비밀번호 검증
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // 계정 상태 확인
      if (user.locked) {
        throw new Error('Account is locked');
      }

      // 로그인 기록
      await this.logLogin(user.id);

      // 토큰 생성
      const tokens = this.generateTokenPair(user);

      this.emit('user.loggedIn', { userId: user.id, timestamp: new Date() });

      return {
        user: this.sanitizeUser(user),
        tokens,
        isFirstLogin: false
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // 소셜 로그인 기능
  async googleLogin(token) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: this.config.google.clientId
      });

      const payload = ticket.getPayload();
      const { email, name, picture } = payload;

      // 기존 사용자 확인 또는 새 사용자 생성
      let user = await this.findUserByEmail(email);
      
      if (!user) {
        user = {
          email,
          name,
          avatar: picture,
          type: 'influencer', // 기본값
          socialLogins: { google: payload.sub },
          verified: true,
          createdAt: new Date()
        };
        
        this.emit('user.registered', { user, provider: 'google' });
      }

      const tokens = this.generateTokenPair(user);
      this.emit('user.loggedIn', { userId: user.id, provider: 'google' });

      return {
        user: this.sanitizeUser(user),
        tokens,
        isFirstLogin: !user.id
      };
    } catch (error) {
      throw new Error(`Google login failed: ${error.message}`);
    }
  }

  // 인스타그램 연동
  async instagramConnect(userId, accessToken) {
    try {
      // Instagram Basic Display API를 사용하여 사용자 정보 가져오기
      const response = await axios.get('https://graph.instagram.com/me', {
        params: {
          fields: 'id,username,account_type,media_count',
          access_token: accessToken
        }
      });

      const instagramData = response.data;

      // 팔로워 수 및 참여율 계산 (실제로는 더 복잡한 로직)
      const mediaResponse = await axios.get(`https://graph.instagram.com/${instagramData.id}/media`, {
        params: {
          fields: 'like_count,comments_count,timestamp',
          access_token: accessToken
        }
      });

      const stats = this.calculateInstagramStats(mediaResponse.data);

      const platformConnection = {
        type: 'instagram',
        platformId: instagramData.id,
        username: instagramData.username,
        accessToken,
        refreshToken: null, // Instagram Basic Display doesn't provide refresh tokens
        stats,
        connectedAt: new Date(),
        isVerified: true
      };

      // 사용자 정보 업데이트
      await this.updateUserPlatform(userId, platformConnection);

      this.emit('social.connected', { userId, platform: 'instagram', stats });

      return platformConnection;
    } catch (error) {
      throw new Error(`Instagram connection failed: ${error.message}`);
    }
  }

  // 유튜브 연동
  async youtubeConnect(userId, accessToken) {
    try {
      // YouTube Data API를 사용하여 채널 정보 가져오기
      const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
          part: 'snippet,statistics',
          mine: true,
          access_token: accessToken
        }
      });

      const channelData = response.data.items[0];
      const stats = {
        subscribers: parseInt(channelData.statistics.subscriberCount),
        views: parseInt(channelData.statistics.viewCount),
        videos: parseInt(channelData.statistics.videoCount)
      };

      const platformConnection = {
        type: 'youtube',
        platformId: channelData.id,
        username: channelData.snippet.title,
        accessToken,
        stats,
        connectedAt: new Date(),
        isVerified: true
      };

      await this.updateUserPlatform(userId, platformConnection);
      this.emit('social.connected', { userId, platform: 'youtube', stats });

      return platformConnection;
    } catch (error) {
      throw new Error(`YouTube connection failed: ${error.message}`);
    }
  }

  // 권한 관리
  async checkPermission(userId, resource, action) {
    try {
      const user = await this.findUserById(userId);
      if (!user) return false;

      const requiredPermission = `${resource}:${action}`;
      return user.permissions.includes(requiredPermission) || user.permissions.includes('admin:*');
    } catch (error) {
      return false;
    }
  }

  async assignRole(userId, role) {
    try {
      const permissions = this.getRolePermissions(role);
      await this.updateUserPermissions(userId, permissions);
      
      this.emit('user.roleAssigned', { userId, role, permissions });
    } catch (error) {
      throw new Error(`Role assignment failed: ${error.message}`);
    }
  }

  // 보안 기능
  async enableTwoFactor(userId) {
    const secret = this.generateTwoFactorSecret();
    const qrCode = await this.generateQRCode(userId, secret);
    const backupCodes = this.generateBackupCodes();

    await this.updateUserTwoFactor(userId, { secret, backupCodes, enabled: false });

    return {
      qrCode,
      backupCodes,
      secret
    };
  }

  async verifyTwoFactor(userId, code) {
    const user = await this.findUserById(userId);
    if (!user.twoFactor || !user.twoFactor.enabled) {
      return false;
    }

    return this.verifyTOTP(user.twoFactor.secret, code);
  }

  // 유틸리티 메서드
  generateTokenPair(user) {
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        type: user.type,
        permissions: user.permissions 
      },
      this.jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      this.jwtSecret,
      { expiresIn: '7d' }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900 // 15분
    };
  }

  getDefaultPermissions(userType) {
    const permissions = {
      business: [
        'campaign:create',
        'campaign:read',
        'campaign:update',
        'campaign:delete',
        'influencer:search',
        'payment:create',
        'analytics:read'
      ],
      influencer: [
        'profile:update',
        'campaign:apply',
        'campaign:read',
        'content:create',
        'earnings:read'
      ]
    };

    return permissions[userType] || [];
  }

  getRolePermissions(role) {
    const rolePermissions = {
      admin: ['admin:*'],
      moderator: [
        'campaign:moderate',
        'user:suspend',
        'content:review'
      ],
      verified_business: [
        ...this.getDefaultPermissions('business'),
        'campaign:priority',
        'analytics:advanced'
      ],
      verified_influencer: [
        ...this.getDefaultPermissions('influencer'),
        'profile:verified_badge',
        'campaign:priority_access'
      ]
    };

    return rolePermissions[role] || [];
  }

  calculateInstagramStats(mediaData) {
    if (!mediaData.length) return { engagement: 0, avgLikes: 0, avgComments: 0 };

    const totalLikes = mediaData.reduce((sum, post) => sum + (post.like_count || 0), 0);
    const totalComments = mediaData.reduce((sum, post) => sum + (post.comments_count || 0), 0);
    
    return {
      engagement: ((totalLikes + totalComments) / mediaData.length).toFixed(2),
      avgLikes: Math.round(totalLikes / mediaData.length),
      avgComments: Math.round(totalComments / mediaData.length),
      postsAnalyzed: mediaData.length
    };
  }

  sanitizeUser(user) {
    const { password, twoFactor, ...sanitized } = user;
    return sanitized;
  }

  // 이벤트 시스템
  emit(eventName, data) {
    // 실제 구현에서는 event bus를 사용
    console.log(`Event emitted: ${eventName}`, data);
  }

  // DB 상호작용 메서드 (실제로는 별도 모듈에서 구현)
  async findUserByEmail(email) {
    // MongoDB 쿼리 구현
  }

  async findUserById(id) {
    // MongoDB 쿼리 구현
  }

  async updateUserPlatform(userId, platformData) {
    // MongoDB 업데이트 구현
  }

  async logLogin(userId) {
    // 로그인 기록 저장
  }
}

module.exports = RevuAuthModule;