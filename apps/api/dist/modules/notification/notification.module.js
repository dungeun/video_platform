"use strict";
/**
 * Notification Module
 * 알림 모듈 초기화 및 생명주기 관리
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModule = void 0;
const notification_adapter_1 = require("./notification.adapter");
const notification_service_1 = require("./notification.service");
const notification_router_1 = require("./notification.router");
class NotificationModule {
    deps;
    adapter;
    service;
    router;
    initialized = false;
    constructor(deps) {
        this.deps = deps;
        this.adapter = new notification_adapter_1.NotificationModuleAdapter(deps);
        this.service = new notification_service_1.NotificationService(this.adapter, deps.eventBus);
        this.router = (0, notification_router_1.createNotificationRouter)(this.service);
    }
    async initialize() {
        if (this.initialized) {
            return;
        }
        // 이벤트 리스너 등록
        this.setupEventListeners();
        this.initialized = true;
        console.log('Notification module initialized');
    }
    setupEventListeners() {
        const { eventBus } = this.deps;
        // 알림 전송 요청 처리
        eventBus.on('notification.send', async (data) => {
            console.log('Notification send request:', data);
            await this.service.sendNotification(data);
        });
        // 이메일 전송 처리 (실제 구현은 이메일 서비스에서)
        eventBus.on('email.send', async (data) => {
            console.log('Email send request:', data);
            // TODO: 실제 이메일 전송 로직
            // 여기서는 로그만 출력
            console.log(`Email would be sent to ${data.to}: ${data.subject}`);
        });
        // 사용자 연결 시 읽지 않은 알림 개수 전송
        this.deps.io.on('connection', (socket) => {
            socket.on('authenticated', async (userId) => {
                // 사용자 채널 참여
                socket.join(`user:${userId}`);
                // 읽지 않은 알림 개수 조회 및 전송
                try {
                    const cachedCount = await this.deps.redis.get(`notification:unread:${userId}`);
                    if (cachedCount) {
                        socket.emit('notification:unread', {
                            count: parseInt(cachedCount)
                        });
                    }
                    else {
                        // 캐시가 없으면 DB에서 조회
                        const result = await this.service.getNotifications(userId, {
                            read: false,
                            page: 1,
                            limit: 1
                        });
                        if (result.success && result.data) {
                            const count = result.data.pagination.total;
                            socket.emit('notification:unread', { count });
                            // 캐시 저장
                            await this.deps.redis.setWithExpiry(`notification:unread:${userId}`, String(count), 3600);
                        }
                    }
                }
                catch (error) {
                    console.error('Failed to get unread notification count:', error);
                }
            });
        });
    }
    getRouter() {
        return this.router;
    }
    getService() {
        return this.service;
    }
    async destroy() {
        // 이벤트 리스너 정리
        this.deps.eventBus.removeAllListeners('notification.send');
        this.deps.eventBus.removeAllListeners('email.send');
        this.initialized = false;
        console.log('Notification module destroyed');
    }
    // 정적 메서드로 모듈 타입 정의
    static getModuleType() {
        return 'notification';
    }
    static getDependencies() {
        return ['auth', 'database', 'redis'];
    }
}
exports.NotificationModule = NotificationModule;
