const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const jwt = require('jsonwebtoken');
const { prisma } = require('../db/prisma');

class ChatServer {
  constructor(httpServer) {
    // Socket.io 서버 초기화
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Redis 어댑터 설정 (스케일링을 위해)
    this.setupRedisAdapter();
    
    // 룸별 상태 관리
    this.rooms = new Map();
    this.userSessions = new Map();
    
    // 이벤트 리스너 설정
    this.setupEventListeners();
    
    // 글로벌 접근을 위해 저장
    global.io = this.io;
  }

  async setupRedisAdapter() {
    if (process.env.REDIS_URL) {
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();
      
      await Promise.all([
        pubClient.connect(),
        subClient.connect()
      ]);
      
      this.io.adapter(createAdapter(pubClient, subClient));
      console.log('✅ Redis adapter connected for Socket.io');
    }
  }

  setupEventListeners() {
    // 인증 미들웨어
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        // JWT 검증
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // 사용자 정보 가져오기
        const user = await prisma.users.findUnique({
          where: { id: decoded.userId },
          include: { profiles: true }
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        // 소켓에 사용자 정보 저장
        socket.userId = user.id;
        socket.user = {
          id: user.id,
          name: user.name,
          avatar: user.profiles?.profileImage,
          type: user.type,
          verified: user.verified
        };

        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });

    // 연결 이벤트
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.user.name} (${socket.id})`);
      
      // 사용자 세션 저장
      this.userSessions.set(socket.userId, socket.id);
      
      // 라이브 스트림 룸 참가
      socket.on('join:stream', async (data) => {
        await this.handleJoinStream(socket, data);
      });
      
      // 라이브 스트림 룸 퇴장
      socket.on('leave:stream', async (data) => {
        await this.handleLeaveStream(socket, data);
      });
      
      // 채팅 메시지
      socket.on('chat:message', async (data) => {
        await this.handleChatMessage(socket, data);
      });
      
      // 슈퍼챗 (후원)
      socket.on('chat:superchat', async (data) => {
        await this.handleSuperChat(socket, data);
      });
      
      // 이모티콘/스티커
      socket.on('chat:emote', async (data) => {
        await this.handleEmote(socket, data);
      });
      
      // 모더레이션 명령
      socket.on('mod:timeout', async (data) => {
        await this.handleTimeout(socket, data);
      });
      
      socket.on('mod:ban', async (data) => {
        await this.handleBan(socket, data);
      });
      
      socket.on('mod:delete', async (data) => {
        await this.handleDeleteMessage(socket, data);
      });
      
      socket.on('mod:slow', async (data) => {
        await this.handleSlowMode(socket, data);
      });
      
      // 연결 해제
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user.name}`);
        this.userSessions.delete(socket.userId);
        
        // 모든 룸에서 퇴장
        socket.rooms.forEach(room => {
          if (room !== socket.id) {
            this.updateRoomViewers(room, -1);
          }
        });
      });
    });
  }

  // 스트림 룸 참가 처리
  async handleJoinStream(socket, { streamId }) {
    try {
      // 스트림 확인
      const stream = await prisma.live_streams.findUnique({
        where: { id: streamId },
        include: { channels: true }
      });

      if (!stream || stream.status !== 'LIVE') {
        socket.emit('error', { message: 'Stream not found or not live' });
        return;
      }

      // 룸 참가
      socket.join(`stream:${streamId}`);
      
      // 룸 상태 초기화 또는 업데이트
      if (!this.rooms.has(streamId)) {
        this.rooms.set(streamId, {
          viewers: 0,
          messages: [],
          moderators: [stream.channels.userId],
          slowMode: 0,
          subscriberOnly: false,
          bannedUsers: new Set(),
          timeouts: new Map()
        });
      }

      const room = this.rooms.get(streamId);
      room.viewers++;

      // 시청자 수 업데이트
      await this.updateStreamViewers(streamId, room.viewers);

      // 최근 메시지 가져오기
      const recentMessages = await prisma.live_chat_messages.findMany({
        where: { streamId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          users: {
            include: { profiles: true }
          }
        }
      });

      // 입장 알림
      this.io.to(`stream:${streamId}`).emit('user:joined', {
        user: socket.user,
        viewerCount: room.viewers
      });

      // 클라이언트에 초기 데이터 전송
      socket.emit('stream:joined', {
        streamId,
        viewerCount: room.viewers,
        messages: recentMessages.reverse(),
        moderators: room.moderators,
        slowMode: room.slowMode,
        subscriberOnly: room.subscriberOnly
      });

    } catch (error) {
      console.error('Error joining stream:', error);
      socket.emit('error', { message: 'Failed to join stream' });
    }
  }

  // 스트림 룸 퇴장 처리
  async handleLeaveStream(socket, { streamId }) {
    socket.leave(`stream:${streamId}`);
    
    const room = this.rooms.get(streamId);
    if (room) {
      room.viewers--;
      
      // 시청자 수 업데이트
      await this.updateStreamViewers(streamId, room.viewers);
      
      // 퇴장 알림
      this.io.to(`stream:${streamId}`).emit('user:left', {
        user: socket.user,
        viewerCount: room.viewers
      });
      
      // 룸이 비었으면 제거
      if (room.viewers <= 0) {
        this.rooms.delete(streamId);
      }
    }
  }

  // 채팅 메시지 처리
  async handleChatMessage(socket, { streamId, message }) {
    try {
      const room = this.rooms.get(streamId);
      if (!room) {
        socket.emit('error', { message: 'Stream not found' });
        return;
      }

      // 밴/타임아웃 확인
      if (room.bannedUsers.has(socket.userId)) {
        socket.emit('error', { message: 'You are banned from this chat' });
        return;
      }

      const timeout = room.timeouts.get(socket.userId);
      if (timeout && timeout > Date.now()) {
        socket.emit('error', { 
          message: `You are timed out for ${Math.ceil((timeout - Date.now()) / 1000)} seconds` 
        });
        return;
      }

      // 슬로우 모드 확인
      if (room.slowMode > 0) {
        const lastMessage = socket.lastMessageTime || 0;
        const timeSinceLastMessage = Date.now() - lastMessage;
        
        if (timeSinceLastMessage < room.slowMode * 1000) {
          socket.emit('error', { 
            message: `Slow mode: wait ${Math.ceil((room.slowMode * 1000 - timeSinceLastMessage) / 1000)} seconds` 
          });
          return;
        }
        
        socket.lastMessageTime = Date.now();
      }

      // 구독자 전용 모드 확인
      if (room.subscriberOnly && !socket.user.verified) {
        socket.emit('error', { message: 'Subscriber-only mode is enabled' });
        return;
      }

      // 메시지 필터링 (욕설, 스팸 등)
      const filteredMessage = this.filterMessage(message);

      // 데이터베이스에 저장
      const chatMessage = await prisma.live_chat_messages.create({
        data: {
          streamId,
          userId: socket.userId,
          message: filteredMessage,
          type: 'MESSAGE'
        },
        include: {
          users: {
            include: { profiles: true }
          }
        }
      });

      // 메시지 브로드캐스트
      this.io.to(`stream:${streamId}`).emit('chat:message', {
        id: chatMessage.id,
        user: {
          id: chatMessage.users.id,
          name: chatMessage.users.name,
          avatar: chatMessage.users.profiles?.profileImage,
          verified: chatMessage.users.verified
        },
        message: chatMessage.message,
        timestamp: chatMessage.createdAt,
        type: 'MESSAGE'
      });

      // 룸 메시지 히스토리에 추가
      room.messages.push(chatMessage.id);
      if (room.messages.length > 100) {
        room.messages.shift();
      }

    } catch (error) {
      console.error('Error handling chat message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  // 슈퍼챗 처리
  async handleSuperChat(socket, { streamId, message, amount, currency }) {
    try {
      const room = this.rooms.get(streamId);
      if (!room) {
        socket.emit('error', { message: 'Stream not found' });
        return;
      }

      // 금액 검증
      if (amount < 1) {
        socket.emit('error', { message: 'Invalid amount' });
        return;
      }

      // 슈퍼챗 생성
      const superChat = await prisma.super_chats.create({
        data: {
          streamId,
          userId: socket.userId,
          amount,
          currency: currency || 'KRW',
          message,
          isPaid: false, // 결제 처리 후 true로 변경
          color: this.getSuperChatColor(amount),
          duration: this.getSuperChatDuration(amount)
        },
        include: {
          users: {
            include: { profiles: true }
          }
        }
      });

      // 채팅 메시지로도 저장
      await prisma.live_chat_messages.create({
        data: {
          streamId,
          userId: socket.userId,
          message,
          type: 'SUPER_CHAT',
          metadata: JSON.stringify({ 
            amount, 
            currency, 
            superChatId: superChat.id 
          })
        }
      });

      // 슈퍼챗 브로드캐스트
      this.io.to(`stream:${streamId}`).emit('chat:superchat', {
        id: superChat.id,
        user: {
          id: superChat.users.id,
          name: superChat.users.name,
          avatar: superChat.users.profiles?.profileImage
        },
        message: superChat.message,
        amount: superChat.amount,
        currency: superChat.currency,
        color: superChat.color,
        duration: superChat.duration,
        timestamp: superChat.createdAt
      });

      // 스트리머에게 알림
      const streamerSocketId = this.userSessions.get(room.moderators[0]);
      if (streamerSocketId) {
        this.io.to(streamerSocketId).emit('superchat:received', {
          from: socket.user.name,
          amount,
          currency,
          message
        });
      }

    } catch (error) {
      console.error('Error handling super chat:', error);
      socket.emit('error', { message: 'Failed to send super chat' });
    }
  }

  // 이모티콘 처리
  async handleEmote(socket, { streamId, emoteId }) {
    try {
      const room = this.rooms.get(streamId);
      if (!room) return;

      // 이모티콘 브로드캐스트
      this.io.to(`stream:${streamId}`).emit('chat:emote', {
        user: socket.user,
        emoteId,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error handling emote:', error);
    }
  }

  // 타임아웃 처리 (모더레이터 전용)
  async handleTimeout(socket, { streamId, userId, duration }) {
    try {
      const room = this.rooms.get(streamId);
      if (!room || !room.moderators.includes(socket.userId)) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      // 타임아웃 설정
      room.timeouts.set(userId, Date.now() + duration * 1000);

      // 해당 사용자에게 알림
      const userSocketId = this.userSessions.get(userId);
      if (userSocketId) {
        this.io.to(userSocketId).emit('mod:timeout', {
          duration,
          reason: 'You have been timed out'
        });
      }

      // 모더레이터에게 확인
      socket.emit('mod:timeout:success', { userId, duration });

    } catch (error) {
      console.error('Error handling timeout:', error);
    }
  }

  // 밴 처리 (모더레이터 전용)
  async handleBan(socket, { streamId, userId }) {
    try {
      const room = this.rooms.get(streamId);
      if (!room || !room.moderators.includes(socket.userId)) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      // 밴 설정
      room.bannedUsers.add(userId);

      // 해당 사용자 강제 퇴장
      const userSocketId = this.userSessions.get(userId);
      if (userSocketId) {
        const userSocket = this.io.sockets.sockets.get(userSocketId);
        if (userSocket) {
          userSocket.leave(`stream:${streamId}`);
          userSocket.emit('mod:banned', {
            streamId,
            reason: 'You have been banned from this stream'
          });
        }
      }

      // 모더레이터에게 확인
      socket.emit('mod:ban:success', { userId });

    } catch (error) {
      console.error('Error handling ban:', error);
    }
  }

  // 메시지 삭제 (모더레이터 전용)
  async handleDeleteMessage(socket, { streamId, messageId }) {
    try {
      const room = this.rooms.get(streamId);
      if (!room || !room.moderators.includes(socket.userId)) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      // 데이터베이스에서 삭제 표시
      await prisma.live_chat_messages.update({
        where: { id: messageId },
        data: { deletedAt: new Date() }
      });

      // 모든 사용자에게 삭제 알림
      this.io.to(`stream:${streamId}`).emit('chat:message:deleted', {
        messageId
      });

    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }

  // 슬로우 모드 설정 (모더레이터 전용)
  async handleSlowMode(socket, { streamId, duration }) {
    try {
      const room = this.rooms.get(streamId);
      if (!room || !room.moderators.includes(socket.userId)) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      // 슬로우 모드 설정
      room.slowMode = duration;

      // 모든 사용자에게 알림
      this.io.to(`stream:${streamId}`).emit('mod:slowmode', {
        enabled: duration > 0,
        duration
      });

    } catch (error) {
      console.error('Error setting slow mode:', error);
    }
  }

  // 메시지 필터링
  filterMessage(message) {
    // 욕설 필터링
    const badWords = ['욕설1', '욕설2']; // 실제로는 더 정교한 필터 필요
    let filtered = message;
    
    badWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filtered = filtered.replace(regex, '*'.repeat(word.length));
    });
    
    // URL 필터링
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    filtered = filtered.replace(urlRegex, '[URL]');
    
    // 과도한 대문자 방지
    if (filtered.length > 10 && filtered === filtered.toUpperCase()) {
      filtered = filtered.toLowerCase();
    }
    
    // 이모지 스팸 방지
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu;
    const emojiCount = (filtered.match(emojiRegex) || []).length;
    if (emojiCount > 10) {
      filtered = filtered.replace(emojiRegex, '');
    }
    
    return filtered.trim();
  }

  // 슈퍼챗 색상 결정
  getSuperChatColor(amount) {
    if (amount >= 50000) return '#F57C00'; // 오렌지
    if (amount >= 10000) return '#00E5FF'; // 시안
    if (amount >= 5000) return '#1DE9B6'; // 민트
    if (amount >= 1000) return '#FFEB3B'; // 노랑
    return '#E0E0E0'; // 회색
  }

  // 슈퍼챗 지속 시간 결정
  getSuperChatDuration(amount) {
    if (amount >= 50000) return 300; // 5분
    if (amount >= 10000) return 120; // 2분
    if (amount >= 5000) return 60; // 1분
    return 0; // 고정 없음
  }

  // 시청자 수 업데이트
  async updateStreamViewers(streamId, count) {
    try {
      await prisma.live_streams.update({
        where: { id: streamId },
        data: { viewerCount: count }
      });
    } catch (error) {
      console.error('Error updating viewer count:', error);
    }
  }

  // 룸 시청자 수 업데이트
  updateRoomViewers(roomId, delta) {
    const streamId = roomId.replace('stream:', '');
    const room = this.rooms.get(streamId);
    if (room) {
      room.viewers += delta;
      this.updateStreamViewers(streamId, room.viewers);
    }
  }
}

module.exports = ChatServer;