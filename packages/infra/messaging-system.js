/**
 * Revu Platform Messaging System Module
 * 실시간 채팅, 파일 공유, 알림, 대화방 관리
 */

const EventEmitter = require('events');
const { Server } = require('socket.io');

// 메시지 타입 정의
const MessageType = {
  TEXT: 'text',
  FILE: 'file',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  SYSTEM: 'system',
  NOTIFICATION: 'notification',
  CAMPAIGN_UPDATE: 'campaign_update'
};

// 채팅방 타입 정의
const ChatRoomType = {
  DIRECT: 'direct',        // 1:1 채팅
  GROUP: 'group',          // 그룹 채팅
  CAMPAIGN: 'campaign',    // 캠페인 관련 채팅
  SUPPORT: 'support'       // 고객 지원
};

// 메시지 상태 정의
const MessageStatus = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
};

// 사용자 상태 정의
const UserStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AWAY: 'away',
  BUSY: 'busy'
};

class MessagingSystemModule extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.chatRooms = new Map(); // roomId -> room
    this.messages = new Map(); // messageId -> message
    this.userSessions = new Map(); // userId -> session info
    this.userStatus = new Map(); // userId -> status
    this.blockedUsers = new Map(); // userId -> Set of blocked userIds
    this.fileStorage = null; // 파일 저장소 연동
    this.eventBus = null;
    
    // Socket.IO 서버 설정
    this.io = null;
    this.connectedUsers = new Map(); // socketId -> userId
    
    // 메시지 검색 인덱스
    this.messageIndex = new Map(); // keyword -> messageIds
    
    // 알림 설정
    this.notificationSettings = new Map(); // userId -> settings
    
    // 메시지 캐시 (최근 메시지)
    this.messageCache = new Map(); // roomId -> recent messages
    this.maxCacheSize = config.maxCacheSize || 100;
    
    this.setupDefaultSettings();
  }

  // Socket.IO 서버 초기화
  initializeSocketServer(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: this.config.allowedOrigins || "*",
        methods: ["GET", "POST"]
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupSocketHandlers();
    console.log('Messaging Socket.IO server initialized');
  }

  // 의존성 주입
  connectEventBus(eventBus) {
    this.eventBus = eventBus;
    this.setupEventHandlers();
  }

  connectFileStorage(fileStorage) {
    this.fileStorage = fileStorage;
  }

  // Socket.IO 이벤트 핸들러 설정
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // 사용자 인증 및 등록
      socket.on('authenticate', async (data) => {
        await this.handleUserAuthentication(socket, data);
      });

      // 채팅방 입장
      socket.on('join_room', async (data) => {
        await this.handleJoinRoom(socket, data);
      });

      // 채팅방 나가기
      socket.on('leave_room', async (data) => {
        await this.handleLeaveRoom(socket, data);
      });

      // 메시지 전송
      socket.on('send_message', async (data) => {
        await this.handleSendMessage(socket, data);
      });

      // 메시지 읽음 처리
      socket.on('mark_read', async (data) => {
        await this.handleMarkRead(socket, data);
      });

      // 타이핑 상태
      socket.on('typing_start', (data) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('typing_stop', (data) => {
        this.handleTypingStop(socket, data);
      });

      // 파일 업로드
      socket.on('upload_file', async (data) => {
        await this.handleFileUpload(socket, data);
      });

      // 메시지 검색
      socket.on('search_messages', async (data) => {
        await this.handleMessageSearch(socket, data);
      });

      // 연결 해제
      socket.on('disconnect', () => {
        this.handleUserDisconnect(socket);
      });
    });
  }

  // 사용자 인증 처리
  async handleUserAuthentication(socket, data) {
    try {
      const { userId, token, userInfo } = data;

      // 토큰 검증 (실제 구현에서는 JWT 검증)
      const isValid = await this.validateUserToken(userId, token);
      if (!isValid) {
        socket.emit('auth_error', { message: 'Invalid token' });
        return;
      }

      // 사용자 세션 등록
      this.connectedUsers.set(socket.id, userId);
      this.userSessions.set(userId, {
        socketId: socket.id,
        connectedAt: new Date(),
        lastActivity: new Date(),
        userInfo
      });

      // 사용자 상태 온라인으로 설정
      this.updateUserStatus(userId, UserStatus.ONLINE);

      // 인증 성공 응답
      socket.emit('authenticated', { 
        userId,
        status: 'authenticated',
        timestamp: new Date()
      });

      // 사용자의 채팅방 목록 전송
      const userRooms = await this.getUserChatRooms(userId);
      socket.emit('user_rooms', userRooms);

      // 온라인 상태 브로드캐스트
      this.broadcastUserStatus(userId, UserStatus.ONLINE);

      console.log(`User authenticated: ${userId} (${socket.id})`);

    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('auth_error', { message: error.message });
    }
  }

  // 채팅방 입장 처리
  async handleJoinRoom(socket, data) {
    try {
      const { roomId } = data;
      const userId = this.connectedUsers.get(socket.id);

      if (!userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // 채팅방 권한 확인
      const hasAccess = await this.checkRoomAccess(userId, roomId);
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to room' });
        return;
      }

      // Socket 방 입장
      await socket.join(roomId);

      // 채팅방 정보 및 최근 메시지 전송
      const room = this.chatRooms.get(roomId);
      const recentMessages = await this.getRecentMessages(roomId, 50);

      socket.emit('room_joined', {
        roomId,
        room,
        recentMessages
      });

      // 입장 알림 (시스템 메시지)
      if (room && room.type !== ChatRoomType.DIRECT) {
        await this.sendSystemMessage(roomId, `${this.getUserName(userId)} joined the room`);
      }

      console.log(`User ${userId} joined room ${roomId}`);

    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { message: error.message });
    }
  }

  // 채팅방 나가기 처리
  async handleLeaveRoom(socket, data) {
    try {
      const { roomId } = data;
      const userId = this.connectedUsers.get(socket.id);

      if (!userId) return;

      // Socket 방 나가기
      await socket.leave(roomId);

      // 나가기 알림 (시스템 메시지)
      const room = this.chatRooms.get(roomId);
      if (room && room.type !== ChatRoomType.DIRECT) {
        await this.sendSystemMessage(roomId, `${this.getUserName(userId)} left the room`);
      }

      socket.emit('room_left', { roomId });

      console.log(`User ${userId} left room ${roomId}`);

    } catch (error) {
      console.error('Leave room error:', error);
    }
  }

  // 메시지 전송 처리
  async handleSendMessage(socket, data) {
    try {
      const { roomId, content, type = MessageType.TEXT, metadata = {} } = data;
      const userId = this.connectedUsers.get(socket.id);

      if (!userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // 차단된 사용자 확인
      const isBlocked = await this.isUserBlocked(roomId, userId);
      if (isBlocked) {
        socket.emit('error', { message: 'You are blocked in this room' });
        return;
      }

      // 메시지 생성
      const message = await this.createMessage({
        roomId,
        senderId: userId,
        content,
        type,
        metadata
      });

      // 메시지 저장
      await this.saveMessage(message);

      // 채팅방 참가자들에게 메시지 전송
      this.io.to(roomId).emit('new_message', message);

      // 읽지 않은 메시지 수 업데이트
      await this.updateUnreadCounts(roomId, userId);

      // 푸시 알림 전송
      await this.sendPushNotifications(roomId, message, userId);

      // 메시지 전송 성공 응답
      socket.emit('message_sent', {
        messageId: message.id,
        timestamp: message.timestamp
      });

      // 이벤트 발행
      this.emit('message.sent', { message, roomId, userId });
      await this.publishEvent('message.sent', {
        messageId: message.id,
        roomId,
        senderId: userId,
        type: message.type
      });

      console.log(`Message sent: ${message.id} in room ${roomId}`);

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: error.message });
    }
  }

  // 메시지 읽음 처리
  async handleMarkRead(socket, data) {
    try {
      const { roomId, messageId } = data;
      const userId = this.connectedUsers.get(socket.id);

      if (!userId) return;

      // 메시지 읽음 상태 업데이트
      await this.markMessageAsRead(messageId, userId);

      // 읽지 않은 메시지 수 업데이트
      await this.updateUnreadCount(roomId, userId);

      // 발신자에게 읽음 확인 전송
      const message = this.messages.get(messageId);
      if (message && message.senderId !== userId) {
        const senderSession = this.userSessions.get(message.senderId);
        if (senderSession) {
          this.io.to(senderSession.socketId).emit('message_read', {
            messageId,
            readBy: userId,
            timestamp: new Date()
          });
        }
      }

    } catch (error) {
      console.error('Mark read error:', error);
    }
  }

  // 타이핑 시작 처리
  handleTypingStart(socket, data) {
    const { roomId } = data;
    const userId = this.connectedUsers.get(socket.id);

    if (!userId) return;

    // 같은 방의 다른 사용자들에게 타이핑 상태 브로드캐스트
    socket.to(roomId).emit('user_typing', {
      userId,
      roomId,
      typing: true
    });
  }

  // 타이핑 중지 처리
  handleTypingStop(socket, data) {
    const { roomId } = data;
    const userId = this.connectedUsers.get(socket.id);

    if (!userId) return;

    // 같은 방의 다른 사용자들에게 타이핑 중지 브로드캐스트
    socket.to(roomId).emit('user_typing', {
      userId,
      roomId,
      typing: false
    });
  }

  // 파일 업로드 처리
  async handleFileUpload(socket, data) {
    try {
      const { roomId, fileName, fileData, fileType, fileSize } = data;
      const userId = this.connectedUsers.get(socket.id);

      if (!userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // 파일 크기 제한 확인
      const maxFileSize = this.config.maxFileSize || 10 * 1024 * 1024; // 10MB
      if (fileSize > maxFileSize) {
        socket.emit('error', { message: 'File size too large' });
        return;
      }

      // 파일 저장
      const fileUrl = await this.saveFile(fileName, fileData, fileType);

      // 파일 메시지 생성
      const message = await this.createMessage({
        roomId,
        senderId: userId,
        content: fileName,
        type: this.getMessageTypeByFileType(fileType),
        metadata: {
          fileUrl,
          fileName,
          fileSize,
          fileType
        }
      });

      // 메시지 저장
      await this.saveMessage(message);

      // 파일 메시지 전송
      this.io.to(roomId).emit('new_message', message);

      // 업로드 성공 응답
      socket.emit('file_uploaded', {
        messageId: message.id,
        fileUrl
      });

      console.log(`File uploaded: ${fileName} in room ${roomId}`);

    } catch (error) {
      console.error('File upload error:', error);
      socket.emit('error', { message: error.message });
    }
  }

  // 메시지 검색 처리
  async handleMessageSearch(socket, data) {
    try {
      const { roomId, query, filters = {}, limit = 20, offset = 0 } = data;
      const userId = this.connectedUsers.get(socket.id);

      if (!userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // 검색 권한 확인
      const hasAccess = await this.checkRoomAccess(userId, roomId);
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // 메시지 검색 실행
      const searchResults = await this.searchMessages(roomId, query, filters, limit, offset);

      socket.emit('search_results', {
        query,
        results: searchResults,
        total: searchResults.length
      });

    } catch (error) {
      console.error('Message search error:', error);
      socket.emit('error', { message: error.message });
    }
  }

  // 사용자 연결 해제 처리
  handleUserDisconnect(socket) {
    const userId = this.connectedUsers.get(socket.id);

    if (userId) {
      // 사용자 세션 정리
      this.connectedUsers.delete(socket.id);
      this.userSessions.delete(userId);

      // 오프라인 상태로 변경
      this.updateUserStatus(userId, UserStatus.OFFLINE);

      // 오프라인 상태 브로드캐스트
      this.broadcastUserStatus(userId, UserStatus.OFFLINE);

      console.log(`User disconnected: ${userId} (${socket.id})`);
    }
  }

  // 채팅방 생성
  async createChatRoom(roomData) {
    try {
      const {
        type,
        name,
        description = '',
        participants = [],
        campaignId = null,
        isPrivate = false,
        metadata = {}
      } = roomData;

      const room = {
        id: this.generateRoomId(),
        type,
        name,
        description,
        participants: new Set(participants),
        campaignId,
        isPrivate,
        createdAt: new Date(),
        lastActivity: new Date(),
        lastMessage: null,
        unreadCount: new Map(), // userId -> count
        settings: {
          allowFileSharing: true,
          allowVoiceMessages: true,
          messageRetentionDays: 365
        },
        metadata
      };

      this.chatRooms.set(room.id, room);

      // 참가자들의 읽지 않은 메시지 수 초기화
      participants.forEach(userId => {
        room.unreadCount.set(userId, 0);
      });

      // 채팅방 생성 이벤트 발행
      this.emit('room.created', { roomId: room.id, room });
      await this.publishEvent('chat.room.created', {
        roomId: room.id,
        type,
        participants,
        campaignId
      });

      console.log(`Chat room created: ${room.id} (${type})`);
      return room;

    } catch (error) {
      console.error('Failed to create chat room:', error);
      throw error;
    }
  }

  // 메시지 생성
  async createMessage(messageData) {
    try {
      const {
        roomId,
        senderId,
        content,
        type = MessageType.TEXT,
        metadata = {}
      } = messageData;

      const message = {
        id: this.generateMessageId(),
        roomId,
        senderId,
        content,
        type,
        timestamp: new Date(),
        status: MessageStatus.SENT,
        readBy: new Set(),
        editedAt: null,
        deletedAt: null,
        replyTo: metadata.replyTo || null,
        metadata
      };

      // 채팅방 마지막 활동 시간 업데이트
      const room = this.chatRooms.get(roomId);
      if (room) {
        room.lastActivity = new Date();
        room.lastMessage = message;
      }

      // 메시지 캐시에 추가
      this.addToMessageCache(roomId, message);

      // 검색 인덱스 업데이트
      this.updateMessageIndex(message);

      return message;

    } catch (error) {
      console.error('Failed to create message:', error);
      throw error;
    }
  }

  // 시스템 메시지 전송
  async sendSystemMessage(roomId, content, metadata = {}) {
    try {
      const message = await this.createMessage({
        roomId,
        senderId: 'system',
        content,
        type: MessageType.SYSTEM,
        metadata
      });

      await this.saveMessage(message);
      this.io.to(roomId).emit('new_message', message);

      return message;

    } catch (error) {
      console.error('Failed to send system message:', error);
      throw error;
    }
  }

  // 캠페인 업데이트 메시지 전송
  async sendCampaignUpdate(campaignId, updateData) {
    try {
      // 캠페인 관련 채팅방 찾기
      const campaignRooms = Array.from(this.chatRooms.values())
        .filter(room => room.campaignId === campaignId);

      for (const room of campaignRooms) {
        const message = await this.createMessage({
          roomId: room.id,
          senderId: 'system',
          content: updateData.message,
          type: MessageType.CAMPAIGN_UPDATE,
          metadata: {
            campaignId,
            updateType: updateData.type,
            data: updateData.data
          }
        });

        await this.saveMessage(message);
        this.io.to(room.id).emit('new_message', message);
      }

    } catch (error) {
      console.error('Failed to send campaign update:', error);
    }
  }

  // 사용자 상태 업데이트
  updateUserStatus(userId, status) {
    this.userStatus.set(userId, {
      status,
      lastSeen: new Date(),
      lastActivity: new Date()
    });
  }

  // 사용자 상태 브로드캐스트
  broadcastUserStatus(userId, status) {
    // 사용자가 속한 모든 채팅방에 상태 변경 브로드캐스트
    const userRooms = Array.from(this.chatRooms.values())
      .filter(room => room.participants.has(userId));

    userRooms.forEach(room => {
      this.io.to(room.id).emit('user_status_change', {
        userId,
        status,
        timestamp: new Date()
      });
    });
  }

  // 읽지 않은 메시지 수 업데이트
  async updateUnreadCounts(roomId, senderId) {
    try {
      const room = this.chatRooms.get(roomId);
      if (!room) return;

      // 발신자를 제외한 모든 참가자의 읽지 않은 메시지 수 증가
      room.participants.forEach(userId => {
        if (userId !== senderId) {
          const currentCount = room.unreadCount.get(userId) || 0;
          room.unreadCount.set(userId, currentCount + 1);

          // 실시간으로 읽지 않은 메시지 수 전송
          const userSession = this.userSessions.get(userId);
          if (userSession) {
            this.io.to(userSession.socketId).emit('unread_count_updated', {
              roomId,
              unreadCount: currentCount + 1
            });
          }
        }
      });

    } catch (error) {
      console.error('Failed to update unread counts:', error);
    }
  }

  // 개별 사용자 읽지 않은 메시지 수 업데이트
  async updateUnreadCount(roomId, userId) {
    try {
      const room = this.chatRooms.get(roomId);
      if (!room) return;

      room.unreadCount.set(userId, 0);

      const userSession = this.userSessions.get(userId);
      if (userSession) {
        this.io.to(userSession.socketId).emit('unread_count_updated', {
          roomId,
          unreadCount: 0
        });
      }

    } catch (error) {
      console.error('Failed to update unread count:', error);
    }
  }

  // 메시지 읽음 처리
  async markMessageAsRead(messageId, userId) {
    try {
      const message = this.messages.get(messageId);
      if (!message) return;

      message.readBy.add(userId);
      message.status = MessageStatus.READ;

      // 메시지 상태 저장
      await this.saveMessage(message);

    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }

  // 푸시 알림 전송
  async sendPushNotifications(roomId, message, senderId) {
    try {
      const room = this.chatRooms.get(roomId);
      if (!room) return;

      // 오프라인 사용자들에게 푸시 알림
      room.participants.forEach(async (userId) => {
        if (userId === senderId) return;

        const userSession = this.userSessions.get(userId);
        const userStatus = this.userStatus.get(userId);

        // 오프라인이거나 알림 설정이 켜진 경우
        if (!userSession || (userStatus && userStatus.status === UserStatus.OFFLINE)) {
          const notificationSettings = this.notificationSettings.get(userId);
          if (!notificationSettings || notificationSettings.pushEnabled) {
            await this.publishEvent('notification.push', {
              userId,
              title: `New message from ${this.getUserName(senderId)}`,
              body: this.formatMessageForNotification(message),
              data: {
                roomId,
                messageId: message.id,
                type: 'chat_message'
              }
            });
          }
        }
      });

    } catch (error) {
      console.error('Failed to send push notifications:', error);
    }
  }

  // 메시지 검색
  async searchMessages(roomId, query, filters = {}, limit = 20, offset = 0) {
    try {
      // 실제 구현에서는 더 복잡한 검색 로직 사용
      const roomMessages = Array.from(this.messages.values())
        .filter(message => message.roomId === roomId)
        .filter(message => {
          if (!query) return true;
          return message.content.toLowerCase().includes(query.toLowerCase());
        })
        .filter(message => {
          // 필터 적용
          if (filters.type && message.type !== filters.type) return false;
          if (filters.senderId && message.senderId !== filters.senderId) return false;
          if (filters.startDate && message.timestamp < new Date(filters.startDate)) return false;
          if (filters.endDate && message.timestamp > new Date(filters.endDate)) return false;
          return true;
        })
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(offset, offset + limit);

      return roomMessages;

    } catch (error) {
      console.error('Failed to search messages:', error);
      return [];
    }
  }

  // 메시지 캐시 관리
  addToMessageCache(roomId, message) {
    if (!this.messageCache.has(roomId)) {
      this.messageCache.set(roomId, []);
    }

    const cache = this.messageCache.get(roomId);
    cache.unshift(message);

    // 캐시 크기 제한
    if (cache.length > this.maxCacheSize) {
      cache.splice(this.maxCacheSize);
    }
  }

  // 최근 메시지 조회
  async getRecentMessages(roomId, limit = 50) {
    const cache = this.messageCache.get(roomId) || [];
    
    if (cache.length >= limit) {
      return cache.slice(0, limit);
    }

    // 캐시에 충분하지 않으면 데이터베이스에서 조회
    const messages = Array.from(this.messages.values())
      .filter(message => message.roomId === roomId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    return messages;
  }

  // 검색 인덱스 업데이트
  updateMessageIndex(message) {
    if (message.type !== MessageType.TEXT) return;

    const keywords = message.content.toLowerCase().split(/\s+/);
    keywords.forEach(keyword => {
      if (keyword.length < 2) return; // 너무 짧은 단어 제외

      if (!this.messageIndex.has(keyword)) {
        this.messageIndex.set(keyword, new Set());
      }
      this.messageIndex.get(keyword).add(message.id);
    });
  }

  // 사용자 차단 처리
  async blockUser(blockerId, blockedUserId) {
    try {
      if (!this.blockedUsers.has(blockerId)) {
        this.blockedUsers.set(blockerId, new Set());
      }

      this.blockedUsers.get(blockerId).add(blockedUserId);

      // 차단 이벤트 발행
      await this.publishEvent('user.blocked', {
        blockerId,
        blockedUserId
      });

      console.log(`User ${blockerId} blocked user ${blockedUserId}`);

    } catch (error) {
      console.error('Failed to block user:', error);
      throw error;
    }
  }

  // 사용자 차단 해제
  async unblockUser(blockerId, blockedUserId) {
    try {
      const blockedSet = this.blockedUsers.get(blockerId);
      if (blockedSet) {
        blockedSet.delete(blockedUserId);
      }

      // 차단 해제 이벤트 발행
      await this.publishEvent('user.unblocked', {
        blockerId,
        blockedUserId
      });

      console.log(`User ${blockerId} unblocked user ${blockedUserId}`);

    } catch (error) {
      console.error('Failed to unblock user:', error);
      throw error;
    }
  }

  // 유틸리티 메서드들
  async validateUserToken(userId, token) {
    // 실제 구현에서는 JWT 토큰 검증
    return token && token.length > 0;
  }

  async checkRoomAccess(userId, roomId) {
    const room = this.chatRooms.get(roomId);
    if (!room) return false;

    return room.participants.has(userId);
  }

  async isUserBlocked(roomId, userId) {
    // 실제 구현에서는 더 복잡한 차단 로직
    return false;
  }

  getUserName(userId) {
    // 실제 구현에서는 사용자 정보 조회
    const session = this.userSessions.get(userId);
    return session?.userInfo?.name || `User_${userId}`;
  }

  getMessageTypeByFileType(fileType) {
    if (fileType.startsWith('image/')) return MessageType.IMAGE;
    if (fileType.startsWith('video/')) return MessageType.VIDEO;
    if (fileType.startsWith('audio/')) return MessageType.AUDIO;
    return MessageType.FILE;
  }

  formatMessageForNotification(message) {
    switch (message.type) {
      case MessageType.TEXT:
        return message.content.length > 50 
          ? message.content.substring(0, 50) + '...'
          : message.content;
      case MessageType.IMAGE:
        return '📷 Image';
      case MessageType.FILE:
        return '📎 File';
      case MessageType.VIDEO:
        return '🎥 Video';
      case MessageType.AUDIO:
        return '🎵 Audio';
      default:
        return 'New message';
    }
  }

  async saveFile(fileName, fileData, fileType) {
    // 실제 구현에서는 파일 저장소(S3, CloudFlare 등)에 업로드
    const fileId = this.generateFileId();
    const fileUrl = `/files/${fileId}/${fileName}`;
    
    // Mock 파일 저장
    console.log(`File saved: ${fileName} -> ${fileUrl}`);
    
    return fileUrl;
  }

  // API 메서드들
  async getUserChatRooms(userId) {
    const userRooms = Array.from(this.chatRooms.values())
      .filter(room => room.participants.has(userId))
      .map(room => ({
        id: room.id,
        type: room.type,
        name: room.name,
        lastMessage: room.lastMessage,
        lastActivity: room.lastActivity,
        unreadCount: room.unreadCount.get(userId) || 0,
        participants: Array.from(room.participants)
      }))
      .sort((a, b) => b.lastActivity - a.lastActivity);

    return userRooms;
  }

  async getChatRoom(roomId) {
    return this.chatRooms.get(roomId);
  }

  async addUserToRoom(roomId, userId) {
    const room = this.chatRooms.get(roomId);
    if (!room) {
      throw new Error(`Room not found: ${roomId}`);
    }

    room.participants.add(userId);
    room.unreadCount.set(userId, 0);

    // 입장 시스템 메시지
    if (room.type !== ChatRoomType.DIRECT) {
      await this.sendSystemMessage(roomId, `${this.getUserName(userId)} joined the room`);
    }

    return room;
  }

  async removeUserFromRoom(roomId, userId) {
    const room = this.chatRooms.get(roomId);
    if (!room) {
      throw new Error(`Room not found: ${roomId}`);
    }

    room.participants.delete(userId);
    room.unreadCount.delete(userId);

    // 나가기 시스템 메시지
    if (room.type !== ChatRoomType.DIRECT) {
      await this.sendSystemMessage(roomId, `${this.getUserName(userId)} left the room`);
    }

    return room;
  }

  // 기본 설정
  setupDefaultSettings() {
    // 기본 알림 설정 등
  }

  // 이벤트 핸들러 설정
  setupEventHandlers() {
    if (!this.eventBus) return;

    this.eventBus.subscribe('campaign.created', this.handleCampaignCreated.bind(this));
    this.eventBus.subscribe('campaign.state.changed', this.handleCampaignStateChanged.bind(this));
    this.eventBus.subscribe('influencer.selected', this.handleInfluencerSelected.bind(this));
  }

  async handleCampaignCreated(event) {
    const { campaignId, businessId } = event.data;

    // 캠페인 관련 채팅방 생성
    await this.createChatRoom({
      type: ChatRoomType.CAMPAIGN,
      name: `Campaign ${campaignId}`,
      description: 'Campaign discussion room',
      participants: [businessId],
      campaignId,
      isPrivate: false
    });
  }

  async handleCampaignStateChanged(event) {
    const { campaignId, currentState, previousState } = event.data;

    await this.sendCampaignUpdate(campaignId, {
      type: 'state_change',
      message: `Campaign status changed from ${previousState} to ${currentState}`,
      data: { currentState, previousState }
    });
  }

  async handleInfluencerSelected(event) {
    const { campaignId, influencerId, businessId } = event.data;

    // 캠페인 채팅방에 인플루언서 추가
    const campaignRooms = Array.from(this.chatRooms.values())
      .filter(room => room.campaignId === campaignId);

    for (const room of campaignRooms) {
      await this.addUserToRoom(room.id, influencerId);
    }

    // 1:1 채팅방 생성
    await this.createChatRoom({
      type: ChatRoomType.DIRECT,
      name: `${this.getUserName(businessId)} & ${this.getUserName(influencerId)}`,
      participants: [businessId, influencerId],
      campaignId,
      isPrivate: true
    });
  }

  // 저장 메서드
  async saveMessage(message) {
    this.messages.set(message.id, message);
    // 실제 구현에서는 데이터베이스에 저장
    console.log(`Message saved: ${message.id}`);
  }

  // 이벤트 발행 헬퍼
  async publishEvent(eventName, data) {
    if (this.eventBus) {
      await this.eventBus.publish(eventName, data);
    }
  }

  // ID 생성기
  generateRoomId() {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateFileId() {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 헬스체크
  async healthCheck() {
    return {
      status: 'healthy',
      connectedUsers: this.connectedUsers.size,
      activeChatRooms: this.chatRooms.size,
      totalMessages: this.messages.size,
      timestamp: new Date()
    };
  }

  // 정리
  async shutdown() {
    if (this.io) {
      this.io.close();
    }
    this.removeAllListeners();
    console.log('Messaging System Module shutting down...');
  }
}

// 상수 내보내기
MessagingSystemModule.MessageType = MessageType;
MessagingSystemModule.ChatRoomType = ChatRoomType;
MessagingSystemModule.MessageStatus = MessageStatus;
MessagingSystemModule.UserStatus = UserStatus;

module.exports = MessagingSystemModule;