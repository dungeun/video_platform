// src/types/index.ts
var ModuleStatus = /* @__PURE__ */ ((ModuleStatus2) => {
  ModuleStatus2["LOADING"] = "loading";
  ModuleStatus2["LOADED"] = "loaded";
  ModuleStatus2["ERROR"] = "error";
  ModuleStatus2["DISABLED"] = "disabled";
  return ModuleStatus2;
})(ModuleStatus || {});
var CommonErrorCodes = /* @__PURE__ */ ((CommonErrorCodes2) => {
  CommonErrorCodes2["SYSTEM_INTERNAL_ERROR"] = "SYSTEM_900";
  CommonErrorCodes2["SYSTEM_MAINTENANCE"] = "SYSTEM_901";
  CommonErrorCodes2["SYSTEM_TIMEOUT"] = "SYSTEM_902";
  CommonErrorCodes2["VALIDATION_FAILED"] = "VAL_800";
  CommonErrorCodes2["INVALID_FORMAT"] = "VAL_801";
  CommonErrorCodes2["REQUIRED_FIELD_MISSING"] = "VAL_802";
  CommonErrorCodes2["NETWORK_ERROR"] = "NET_700";
  CommonErrorCodes2["API_UNAVAILABLE"] = "NET_701";
  CommonErrorCodes2["RATE_LIMIT_EXCEEDED"] = "NET_702";
  return CommonErrorCodes2;
})(CommonErrorCodes || {});
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2["DEBUG"] = "debug";
  LogLevel2["INFO"] = "info";
  LogLevel2["WARN"] = "warn";
  LogLevel2["ERROR"] = "error";
  return LogLevel2;
})(LogLevel || {});

// src/events/EventEmitter.ts
import { v4 as uuidv4 } from "uuid";
var EventEmitter = class {
  constructor() {
    this.subscriptions = /* @__PURE__ */ new Map();
    this.eventHandlers = /* @__PURE__ */ new Map();
  }
  /**
   * 이벤트 구독
   */
  on(eventType, handler) {
    const subscriptionId = uuidv4();
    const subscription = {
      id: subscriptionId,
      eventType,
      handler,
      once: false
    };
    this.subscriptions.set(subscriptionId, subscription);
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, /* @__PURE__ */ new Set());
    }
    this.eventHandlers.get(eventType).add(subscriptionId);
    return subscriptionId;
  }
  /**
   * 일회성 이벤트 구독
   */
  once(eventType, handler) {
    const subscriptionId = uuidv4();
    const subscription = {
      id: subscriptionId,
      eventType,
      handler,
      once: true
    };
    this.subscriptions.set(subscriptionId, subscription);
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, /* @__PURE__ */ new Set());
    }
    this.eventHandlers.get(eventType).add(subscriptionId);
    return subscriptionId;
  }
  /**
   * 이벤트 구독 해제
   */
  off(subscriptionId) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.subscriptions.delete(subscriptionId);
      const handlers = this.eventHandlers.get(subscription.eventType);
      if (handlers) {
        handlers.delete(subscriptionId);
        if (handlers.size === 0) {
          this.eventHandlers.delete(subscription.eventType);
        }
      }
    }
  }
  /**
   * 이벤트 발행
   */
  emit(eventType, payload, options) {
    const event = {
      id: uuidv4(),
      timestamp: Date.now(),
      source: options?.source || "unknown",
      type: eventType,
      target: options?.target,
      payload,
      correlationId: options?.correlationId,
      userId: options?.userId
    };
    this.processEvent(event);
  }
  /**
   * 특정 이벤트 타입의 구독자 수 반환
   */
  getSubscriberCount(eventType) {
    const handlers = this.eventHandlers.get(eventType);
    return handlers ? handlers.size : 0;
  }
  /**
   * 모든 구독 해제
   */
  removeAllListeners(eventType) {
    if (eventType) {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.forEach((subscriptionId) => {
          this.subscriptions.delete(subscriptionId);
        });
        this.eventHandlers.delete(eventType);
      }
    } else {
      this.subscriptions.clear();
      this.eventHandlers.clear();
    }
  }
  /**
   * 현재 활성 구독 목록 반환
   */
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.values());
  }
  /**
   * 구독된 이벤트 타입 목록 반환
   */
  getEventTypes() {
    return Array.from(this.eventHandlers.keys());
  }
  // ===== 내부 메서드 =====
  /**
   * 이벤트 처리
   */
  async processEvent(event) {
    const handlers = this.eventHandlers.get(event.type);
    if (!handlers || handlers.size === 0) {
      return;
    }
    const promises = [];
    const handlersToRemove = [];
    handlers.forEach((subscriptionId) => {
      const subscription = this.subscriptions.get(subscriptionId);
      if (subscription) {
        promises.push(this.executeHandler(subscription, event));
        if (subscription.once) {
          handlersToRemove.push(subscriptionId);
        }
      }
    });
    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.error("\uC774\uBCA4\uD2B8 \uD578\uB4E4\uB7EC \uC2E4\uD589 \uC911 \uC624\uB958:", error);
    }
    handlersToRemove.forEach((id) => this.off(id));
  }
  /**
   * 개별 핸들러 실행
   */
  async executeHandler(subscription, event) {
    try {
      await subscription.handler({ ...event, payload: event.payload || {} });
    } catch (error) {
      console.error(
        `\uC774\uBCA4\uD2B8 \uD578\uB4E4\uB7EC \uC2E4\uD589 \uC2E4\uD328: ${subscription.eventType}`,
        {
          subscriptionId: subscription.id,
          eventId: event.id,
          error
        }
      );
    }
  }
};
var GlobalEventBus = class _GlobalEventBus extends EventEmitter {
  constructor() {
    super();
  }
  static getInstance() {
    if (!_GlobalEventBus.instance) {
      _GlobalEventBus.instance = new _GlobalEventBus();
    }
    return _GlobalEventBus.instance;
  }
  /**
   * 모듈 이벤트 발행 (표준 형식 강제)
   */
  emitModuleEvent(source, eventType, payload, options) {
    this.emit(eventType, payload, {
      source,
      ...options
    });
  }
};
var EventBus = GlobalEventBus.getInstance();

// src/logging/Logger.ts
var Logger = class _Logger {
  constructor(moduleName, logLevel = "info" /* INFO */) {
    this.moduleName = moduleName;
    this.logLevel = logLevel;
  }
  /**
   * 상관관계 ID 설정 (요청 추적용)
   */
  setCorrelationId(correlationId) {
    this.correlationId = correlationId;
  }
  /**
   * 상관관계 ID 초기화
   */
  clearCorrelationId() {
    this.correlationId = void 0;
  }
  /**
   * DEBUG 레벨 로그
   */
  debug(message, metadata) {
    this.log("debug" /* DEBUG */, message, metadata);
  }
  /**
   * INFO 레벨 로그
   */
  info(message, metadata) {
    this.log("info" /* INFO */, message, metadata);
  }
  /**
   * WARN 레벨 로그
   */
  warn(message, metadata) {
    this.log("warn" /* WARN */, message, metadata);
  }
  /**
   * ERROR 레벨 로그
   */
  error(message, error, metadata) {
    const errorMetadata = this.extractErrorMetadata(error);
    const combinedMetadata = { ...metadata, ...errorMetadata };
    this.log("error" /* ERROR */, message, combinedMetadata);
  }
  /**
   * 사용자 액션 로그 (보안/추적용)
   */
  logUserAction(userId, action, resource, metadata) {
    this.info(`\uC0AC\uC6A9\uC790 \uC561\uC158: ${action}`, {
      userId,
      action,
      resource,
      type: "user_action",
      ...metadata
    });
  }
  /**
   * 성능 로그
   */
  logPerformance(operation, duration, metadata) {
    this.info(`\uC131\uB2A5: ${operation}`, {
      operation,
      duration,
      type: "performance",
      ...metadata
    });
  }
  /**
   * 비즈니스 이벤트 로그
   */
  logBusinessEvent(event, data, metadata) {
    this.info(`\uBE44\uC988\uB2C8\uC2A4 \uC774\uBCA4\uD2B8: ${event}`, {
      event,
      data,
      type: "business_event",
      ...metadata
    });
  }
  /**
   * 자식 로거 생성 (하위 컴포넌트용)
   */
  child(subModule) {
    const childLogger = new _Logger(
      `${this.moduleName}.${subModule}`,
      this.logLevel
    );
    if (this.correlationId) {
      childLogger.setCorrelationId(this.correlationId);
    }
    return childLogger;
  }
  // ===== 내부 메서드 =====
  /**
   * 기본 로깅 메서드
   */
  log(level, message, metadata) {
    if (!this.shouldLog(level)) {
      return;
    }
    const entry = {
      timestamp: Date.now(),
      level,
      message,
      module: this.moduleName,
      correlationId: this.correlationId,
      metadata
    };
    this.writeLog(entry);
  }
  /**
   * 로그 레벨 확인
   */
  shouldLog(level) {
    const levels = ["debug" /* DEBUG */, "info" /* INFO */, "warn" /* WARN */, "error" /* ERROR */];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }
  /**
   * 실제 로그 출력
   */
  writeLog(entry) {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const module = `[${entry.module}]`.padEnd(20);
    let logMessage = `${timestamp} ${level} ${module} ${entry.message}`;
    if (entry.correlationId) {
      logMessage += ` [${entry.correlationId}]`;
    }
    if (process.env.NODE_ENV === "development") {
      this.consoleLog(entry, logMessage);
    }
    if (process.env.NODE_ENV === "production") {
      this.sendToLoggingService(entry);
    }
  }
  /**
   * 콘솔 로그 출력 (개발용)
   */
  consoleLog(entry, message) {
    switch (entry.level) {
      case "debug" /* DEBUG */:
        console.debug(message);
        break;
      case "info" /* INFO */:
        console.info(message);
        break;
      case "warn" /* WARN */:
        console.warn(message);
        break;
      case "error" /* ERROR */:
        console.error(message);
        break;
    }
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      console.log("Metadata:", entry.metadata);
    }
  }
  /**
   * 외부 로깅 서비스로 전송 (프로덕션용)
   */
  sendToLoggingService(entry) {
    try {
      setImmediate(() => {
        this.mockLoggingServiceCall(entry);
      });
    } catch (error) {
      console.error("\uB85C\uAE45 \uC11C\uBE44\uC2A4 \uC804\uC1A1 \uC2E4\uD328:", error);
    }
  }
  /**
   * 모의 로깅 서비스 호출
   */
  mockLoggingServiceCall(entry) {
  }
  /**
   * 에러 객체에서 메타데이터 추출
   */
  extractErrorMetadata(error) {
    if (!error) {
      return {};
    }
    const metadata = {};
    if (error instanceof Error) {
      metadata.errorName = error.name;
      metadata.errorMessage = error.message;
      if (error.stack) {
        metadata.stackTrace = error.stack;
      }
    }
    if (error.code && error.timestamp) {
      metadata.errorCode = error.code;
      metadata.errorTimestamp = error.timestamp;
      metadata.errorSource = error.source;
      if (error.details) {
        metadata.errorDetails = error.details;
      }
    }
    if (typeof error === "object" && error !== null) {
      metadata.errorData = error;
    }
    return metadata;
  }
};
var GlobalLogger = class _GlobalLogger extends Logger {
  constructor() {
    super("GLOBAL", "info" /* INFO */);
  }
  static getInstance() {
    if (!_GlobalLogger.instance) {
      _GlobalLogger.instance = new _GlobalLogger();
    }
    return _GlobalLogger.instance;
  }
  /**
   * 전역 로그 레벨 설정
   */
  setGlobalLogLevel(level) {
    this.logLevel = level;
  }
};
var globalLogger = GlobalLogger.getInstance();

// src/error/ErrorHandler.ts
var ErrorHandler = class {
  constructor(moduleName) {
    this.moduleName = moduleName;
  }
  /**
   * 에러를 안전하게 처리하여 ModuleError로 변환
   */
  handle(error, context) {
    const moduleError = this.normalizeError(error, context);
    this.lastError = moduleError;
    this.logError(moduleError);
    return moduleError;
  }
  /**
   * 새로운 ModuleError 생성
   */
  createError(code, message, details, correlationId) {
    const error = {
      name: code,
      code,
      message,
      details,
      timestamp: Date.now(),
      source: this.moduleName,
      correlationId
    };
    this.lastError = error;
    return error;
  }
  /**
   * 마지막 에러 반환
   */
  getLastError() {
    return this.lastError;
  }
  /**
   * 에러 초기화
   */
  clearLastError() {
    this.lastError = void 0;
  }
  /**
   * 에러가 특정 코드인지 확인
   */
  isErrorCode(error, code) {
    return error.code === code;
  }
  /**
   * 에러가 복구 가능한지 확인
   */
  isRecoverable(error) {
    const recoverableErrors = [
      "NET_700" /* NETWORK_ERROR */,
      "NET_701" /* API_UNAVAILABLE */,
      "NET_702" /* RATE_LIMIT_EXCEEDED */
    ];
    return recoverableErrors.includes(error.code);
  }
  /**
   * 에러가 재시도 가능한지 확인
   */
  isRetryable(error) {
    const retryableErrors = [
      "NET_700" /* NETWORK_ERROR */,
      "SYSTEM_902" /* SYSTEM_TIMEOUT */,
      "NET_702" /* RATE_LIMIT_EXCEEDED */
    ];
    return retryableErrors.includes(error.code);
  }
  // ===== 내부 메서드 =====
  /**
   * 다양한 에러 타입을 ModuleError로 정규화
   */
  normalizeError(error, context) {
    if (this.isModuleError(error)) {
      return error;
    }
    if (error instanceof Error) {
      return this.fromError(error, context);
    }
    if (typeof error === "string") {
      return this.fromString(error, context);
    }
    if (typeof error === "object" && error !== null) {
      return this.fromObject(error, context);
    }
    return this.createError(
      "SYSTEM_900" /* SYSTEM_INTERNAL_ERROR */,
      context || "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4",
      { originalError: error }
    );
  }
  /**
   * ModuleError 타입 가드
   */
  isModuleError(error) {
    return typeof error === "object" && error !== null && typeof error.code === "string" && typeof error.message === "string" && typeof error.timestamp === "number";
  }
  /**
   * Error 객체에서 ModuleError 생성
   */
  fromError(error, context) {
    if (this.isNetworkError(error)) {
      return this.createError(
        "NET_700" /* NETWORK_ERROR */,
        "\uB124\uD2B8\uC6CC\uD06C \uC5F0\uACB0\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4",
        { originalMessage: error.message }
      );
    }
    if (this.isTimeoutError(error)) {
      return this.createError(
        "SYSTEM_902" /* SYSTEM_TIMEOUT */,
        "\uC694\uCCAD \uC2DC\uAC04\uC774 \uCD08\uACFC\uB418\uC5C8\uC2B5\uB2C8\uB2E4",
        { originalMessage: error.message }
      );
    }
    if (this.isValidationError(error)) {
      return this.createError(
        "VAL_800" /* VALIDATION_FAILED */,
        error.message || "\uC785\uB825\uAC12\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4",
        { originalMessage: error.message }
      );
    }
    return this.createError(
      "SYSTEM_900" /* SYSTEM_INTERNAL_ERROR */,
      context || error.message || "\uC2DC\uC2A4\uD15C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4",
      {
        originalMessage: error.message,
        stack: error.stack
      }
    );
  }
  /**
   * 문자열에서 ModuleError 생성
   */
  fromString(error, context) {
    return this.createError(
      "SYSTEM_900" /* SYSTEM_INTERNAL_ERROR */,
      context || error || "\uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4"
    );
  }
  /**
   * 객체에서 ModuleError 생성
   */
  fromObject(error, context) {
    const code = error.code || "SYSTEM_900" /* SYSTEM_INTERNAL_ERROR */;
    const message = error.message || context || "\uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4";
    return this.createError(code, message, error);
  }
  /**
   * 네트워크 에러 판별
   */
  isNetworkError(error) {
    const networkKeywords = [
      "network",
      "fetch",
      "axios",
      "connection",
      "ENOTFOUND",
      "ECONNREFUSED",
      "ETIMEDOUT"
    ];
    const message = error.message.toLowerCase();
    return networkKeywords.some((keyword) => message.includes(keyword));
  }
  /**
   * 타임아웃 에러 판별
   */
  isTimeoutError(error) {
    const timeoutKeywords = ["timeout", "ETIMEDOUT"];
    const message = error.message.toLowerCase();
    return timeoutKeywords.some((keyword) => message.includes(keyword));
  }
  /**
   * 검증 에러 판별
   */
  isValidationError(error) {
    if (error.name === "ZodError") {
      return true;
    }
    const validationKeywords = ["validation", "invalid", "required"];
    const message = error.message.toLowerCase();
    return validationKeywords.some((keyword) => message.includes(keyword));
  }
  /**
   * 에러 로깅
   */
  logError(error) {
    const logData = {
      module: this.moduleName,
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date(error.timestamp).toISOString(),
        source: error.source,
        correlationId: error.correlationId
      }
    };
    if (process.env.NODE_ENV === "development") {
      console.error("\u{1F6A8} Module Error:", logData);
      if (error.details) {
        console.error("Error Details:", error.details);
      }
    }
  }
};
function isModuleError(error) {
  return typeof error === "object" && error !== null && typeof error.code === "string" && typeof error.message === "string" && typeof error.timestamp === "number";
}
function getErrorMessage(error) {
  if (isModuleError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4";
}
function getErrorCode(error) {
  if (isModuleError(error)) {
    return error.code;
  }
  return "SYSTEM_900" /* SYSTEM_INTERNAL_ERROR */;
}

// src/base/ModuleBase.ts
var ModuleBase = class {
  constructor(config) {
    this.status = "loading" /* LOADING */;
    this.config = config;
    this.eventEmitter = new EventEmitter();
    this.logger = new Logger(config.name);
    this.errorHandler = new ErrorHandler(config.name);
    this.initialize();
  }
  // ===== 공통 라이프사이클 메서드 =====
  /**
   * 모듈 초기화 (Zero Error)
   */
  async initialize() {
    try {
      this.logger.info("\uBAA8\uB4C8 \uCD08\uAE30\uD654 \uC2DC\uC791", { config: this.config });
      const result = await this.onInitialize();
      if (result.success) {
        this.status = "loaded" /* LOADED */;
        this.loadedAt = /* @__PURE__ */ new Date();
        this.logger.info("\uBAA8\uB4C8 \uCD08\uAE30\uD654 \uC644\uB8CC");
        this.eventEmitter.emit("module:loaded", {
          name: this.config.name,
          loadedAt: this.loadedAt
        });
      } else {
        this.handleInitializationError(result.error);
      }
    } catch (error) {
      this.handleInitializationError(error);
    }
  }
  /**
   * 모듈 종료
   */
  async destroy() {
    try {
      this.logger.info("\uBAA8\uB4C8 \uC885\uB8CC \uC2DC\uC791");
      const result = await this.onDestroy();
      if (result.success) {
        this.status = "disabled" /* DISABLED */;
        this.eventEmitter.emit("module:destroyed", {
          name: this.config.name
        });
        this.logger.info("\uBAA8\uB4C8 \uC885\uB8CC \uC644\uB8CC");
      }
      return result;
    } catch (error) {
      const moduleError = this.errorHandler.handle(error);
      this.logger.error("\uBAA8\uB4C8 \uC885\uB8CC \uC911 \uC624\uB958", moduleError);
      return {
        success: false,
        error: moduleError
      };
    }
  }
  // ===== 정보 제공 메서드 =====
  /**
   * 모듈 정보 반환
   */
  getInfo() {
    return {
      config: this.config,
      status: this.status,
      loadedAt: this.loadedAt || /* @__PURE__ */ new Date(),
      error: this.status === "error" /* ERROR */ ? this.getLastError() : void 0
    };
  }
  /**
   * 모듈 설정 반환
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * 모듈 상태 반환
   */
  getStatus() {
    return this.status;
  }
  /**
   * 모듈이 로드되었는지 확인
   */
  isLoaded() {
    return this.status === "loaded" /* LOADED */;
  }
  /**
   * 모듈이 사용 가능한지 확인
   */
  isAvailable() {
    return this.status === "loaded" /* LOADED */;
  }
  // ===== 이벤트 관련 메서드 =====
  /**
   * 이벤트 구독
   */
  on(eventType, handler) {
    return this.eventEmitter.on(eventType, handler);
  }
  /**
   * 일회성 이벤트 구독
   */
  once(eventType, handler) {
    return this.eventEmitter.once(eventType, handler);
  }
  /**
   * 이벤트 구독 해제
   */
  off(subscriptionId) {
    this.eventEmitter.off(subscriptionId);
  }
  /**
   * 이벤트 발행 (내부용)
   */
  emit(eventType, payload) {
    this.eventEmitter.emit(eventType, payload);
  }
  // ===== 에러 처리 =====
  handleInitializationError(error) {
    const moduleError = this.errorHandler.handle(error);
    this.status = "error" /* ERROR */;
    this.logger.error("\uBAA8\uB4C8 \uCD08\uAE30\uD654 \uC2E4\uD328", moduleError);
    this.eventEmitter.emit("module:error", {
      name: this.config.name,
      error: moduleError
    });
  }
  getLastError() {
    return this.errorHandler.getLastError();
  }
  // ===== 유틸리티 메서드 =====
  /**
   * 안전한 비동기 작업 실행 (Zero Error)
   */
  async safeExecute(operation, errorMessage = "\uC791\uC5C5 \uC2E4\uD589 \uC911 \uC624\uB958") {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      const moduleError = this.errorHandler.handle(error, errorMessage);
      this.logger.error(errorMessage, moduleError);
      return { success: false, error: moduleError };
    }
  }
  /**
   * 조건부 실행 (상태 확인)
   */
  requireLoaded(operation) {
    if (!this.isLoaded()) {
      const error = this.errorHandler.createError(
        "MODULE_NOT_LOADED",
        "\uBAA8\uB4C8\uC774 \uB85C\uB4DC\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4"
      );
      return { success: false, error };
    }
    try {
      const data = operation();
      return { success: true, data };
    } catch (error) {
      const moduleError = this.errorHandler.handle(error);
      return { success: false, error: moduleError };
    }
  }
  /**
   * 설정 업데이트
   */
  updateConfig(updates) {
    this.config = { ...this.config, ...updates };
    this.logger.info("\uBAA8\uB4C8 \uC124\uC815 \uC5C5\uB370\uC774\uD2B8\uB428", { updates });
    this.emit("module:config-updated", {
      name: this.config.name,
      updates
    });
  }
};

// src/registry/ModuleRegistry.ts
var ModuleRegistry = class _ModuleRegistry {
  constructor() {
    this.modules = /* @__PURE__ */ new Map();
    this.initializationOrder = [];
    this.logger = new Logger("ModuleRegistry");
    this.errorHandler = new ErrorHandler("ModuleRegistry");
  }
  static getInstance() {
    if (!_ModuleRegistry.instance) {
      _ModuleRegistry.instance = new _ModuleRegistry();
    }
    return _ModuleRegistry.instance;
  }
  /**
   * 모듈 등록
   */
  async register(module, dependencies = []) {
    const config = module.getConfig();
    try {
      this.logger.info(`\uBAA8\uB4C8 \uB4F1\uB85D \uC2DC\uC791: ${config.name}`);
      if (this.modules.has(config.name)) {
        const error = this.errorHandler.createError(
          "MODULE_ALREADY_REGISTERED",
          `\uBAA8\uB4C8\uC774 \uC774\uBBF8 \uB4F1\uB85D\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4: ${config.name}`
        );
        return { success: false, error };
      }
      const dependencyCheck = await this.validateDependencies(dependencies);
      if (!dependencyCheck.success) {
        return dependencyCheck;
      }
      const registration = {
        module,
        config,
        dependencies,
        dependents: [],
        registeredAt: /* @__PURE__ */ new Date()
      };
      this.modules.set(config.name, registration);
      this.updateDependencyRelations(config.name, dependencies);
      EventBus.emitModuleEvent(
        "ModuleRegistry",
        "module:registered",
        { moduleName: config.name, dependencies: dependencies.map((d) => d.name) }
      );
      this.logger.info(`\uBAA8\uB4C8 \uB4F1\uB85D \uC644\uB8CC: ${config.name}`);
      return { success: true };
    } catch (error) {
      const moduleError = this.errorHandler.handle(error, `\uBAA8\uB4C8 \uB4F1\uB85D \uC2E4\uD328: ${config.name}`);
      return { success: false, error: moduleError };
    }
  }
  /**
   * 모듈 해제
   */
  async unregister(moduleName) {
    try {
      this.logger.info(`\uBAA8\uB4C8 \uD574\uC81C \uC2DC\uC791: ${moduleName}`);
      const registration = this.modules.get(moduleName);
      if (!registration) {
        const error = this.errorHandler.createError(
          "MODULE_NOT_FOUND",
          `\uBAA8\uB4C8\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4: ${moduleName}`
        );
        return { success: false, error };
      }
      if (registration.dependents.length > 0) {
        const error = this.errorHandler.createError(
          "MODULE_HAS_DEPENDENTS",
          `\uB2E4\uB978 \uBAA8\uB4C8\uC774 \uC758\uC874\uD558\uACE0 \uC788\uC5B4 \uD574\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4: ${registration.dependents.join(", ")}`
        );
        return { success: false, error };
      }
      const destroyResult = await registration.module.destroy();
      if (!destroyResult.success) {
        return destroyResult;
      }
      this.cleanupDependencyRelations(moduleName, registration.dependencies);
      this.modules.delete(moduleName);
      EventBus.emitModuleEvent(
        "ModuleRegistry",
        "module:unregistered",
        { moduleName }
      );
      this.logger.info(`\uBAA8\uB4C8 \uD574\uC81C \uC644\uB8CC: ${moduleName}`);
      return { success: true };
    } catch (error) {
      const moduleError = this.errorHandler.handle(error, `\uBAA8\uB4C8 \uD574\uC81C \uC2E4\uD328: ${moduleName}`);
      return { success: false, error: moduleError };
    }
  }
  /**
   * 모듈 검색
   */
  get(moduleName) {
    const registration = this.modules.get(moduleName);
    return registration ? registration.module : null;
  }
  /**
   * 모듈 존재 확인
   */
  has(moduleName) {
    return this.modules.has(moduleName);
  }
  /**
   * 모듈 정보 조회
   */
  getInfo(moduleName) {
    const registration = this.modules.get(moduleName);
    return registration ? registration.module.getInfo() : null;
  }
  /**
   * 모든 모듈 목록 조회
   */
  getAllModules() {
    return Array.from(this.modules.keys());
  }
  /**
   * 활성 모듈 목록 조회
   */
  getActiveModules() {
    const activeModules = [];
    for (const [name, registration] of this.modules) {
      if (registration.module.isLoaded()) {
        activeModules.push(name);
      }
    }
    return activeModules;
  }
  /**
   * 모듈 상태 조회
   */
  getModuleStatus(moduleName) {
    const registration = this.modules.get(moduleName);
    return registration ? registration.module.getStatus() : null;
  }
  /**
   * 의존성 그래프 조회
   */
  getDependencyGraph() {
    const graph = {};
    for (const [name, registration] of this.modules) {
      graph[name] = registration.dependencies.map((d) => d.name);
    }
    return graph;
  }
  /**
   * 모듈 초기화 순서 계산
   */
  calculateInitializationOrder() {
    try {
      const order = this.topologicalSort();
      this.initializationOrder = order;
      this.logger.info("\uBAA8\uB4C8 \uCD08\uAE30\uD654 \uC21C\uC11C \uACC4\uC0B0\uB428", { order });
      return { success: true, data: order };
    } catch (error) {
      const moduleError = this.errorHandler.handle(error, "\uCD08\uAE30\uD654 \uC21C\uC11C \uACC4\uC0B0 \uC2E4\uD328");
      return { success: false, error: moduleError };
    }
  }
  /**
   * 모든 모듈 상태 확인
   */
  async healthCheck() {
    const results = {};
    try {
      for (const [name, registration] of this.modules) {
        const healthResult = await registration.module.healthCheck();
        results[name] = healthResult.success && (healthResult.data ?? false);
      }
      const allHealthy = Object.values(results).every((healthy) => healthy);
      this.logger.info("\uBAA8\uB4C8 \uD5EC\uC2A4\uCCB4\uD06C \uC644\uB8CC", { results, allHealthy });
      return { success: true, data: results };
    } catch (error) {
      const moduleError = this.errorHandler.handle(error, "\uD5EC\uC2A4\uCCB4\uD06C \uC2E4\uD328");
      return { success: false, error: moduleError };
    }
  }
  // ===== 내부 메서드 =====
  /**
   * 의존성 검증
   */
  async validateDependencies(dependencies) {
    for (const dependency of dependencies) {
      if (!dependency.optional && !this.modules.has(dependency.name)) {
        const error = this.errorHandler.createError(
          "DEPENDENCY_NOT_FOUND",
          `\uD544\uC218 \uC758\uC874\uC131\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4: ${dependency.name}`
        );
        return { success: false, error };
      }
      if (dependency.version) {
        const dependencyModule = this.modules.get(dependency.name);
        if (dependencyModule && dependencyModule.config.version !== dependency.version) {
          this.logger.warn(
            `\uC758\uC874\uC131 \uBC84\uC804 \uBD88\uC77C\uCE58: ${dependency.name} \uC694\uAD6C(${dependency.version}) vs \uC124\uCE58(${dependencyModule.config.version})`
          );
        }
      }
    }
    return { success: true };
  }
  /**
   * 의존성 관계 업데이트
   */
  updateDependencyRelations(moduleName, dependencies) {
    for (const dependency of dependencies) {
      const dependencyRegistration = this.modules.get(dependency.name);
      if (dependencyRegistration) {
        dependencyRegistration.dependents.push(moduleName);
      }
    }
  }
  /**
   * 의존성 관계 정리
   */
  cleanupDependencyRelations(moduleName, dependencies) {
    for (const dependency of dependencies) {
      const dependencyRegistration = this.modules.get(dependency.name);
      if (dependencyRegistration) {
        const index = dependencyRegistration.dependents.indexOf(moduleName);
        if (index > -1) {
          dependencyRegistration.dependents.splice(index, 1);
        }
      }
    }
  }
  /**
   * 위상 정렬 (의존성 순서 계산)
   */
  topologicalSort() {
    const visited = /* @__PURE__ */ new Set();
    const visiting = /* @__PURE__ */ new Set();
    const result = [];
    const visit = (moduleName) => {
      if (visiting.has(moduleName)) {
        throw new Error(`\uC21C\uD658 \uC758\uC874\uC131 \uAC10\uC9C0: ${moduleName}`);
      }
      if (visited.has(moduleName)) {
        return;
      }
      visiting.add(moduleName);
      const registration = this.modules.get(moduleName);
      if (registration) {
        for (const dependency of registration.dependencies) {
          if (this.modules.has(dependency.name)) {
            visit(dependency.name);
          }
        }
      }
      visiting.delete(moduleName);
      visited.add(moduleName);
      result.push(moduleName);
    };
    for (const moduleName of this.modules.keys()) {
      if (!visited.has(moduleName)) {
        visit(moduleName);
      }
    }
    return result.reverse();
  }
};
var moduleRegistry = ModuleRegistry.getInstance();

// src/index.ts
function safeJsonParse(json) {
  try {
    const data = JSON.parse(json);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "JSON \uD30C\uC2F1 \uC2E4\uD328"
    };
  }
}
function safeJsonStringify(obj) {
  try {
    const data = JSON.stringify(obj);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "JSON \uBB38\uC790\uC5F4\uD654 \uC2E4\uD328"
    };
  }
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function retry(operation, options = {}) {
  const { maxAttempts = 3, delay: baseDelay = 1e3, backoff = true } = options;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const data = await operation();
      return { success: true, data, attempts: attempt };
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delayMs = backoff ? baseDelay * Math.pow(2, attempt - 1) : baseDelay;
        await delay(delayMs);
      }
    }
  }
  return { success: false, error: lastError, attempts: maxAttempts };
}
function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise.then((data) => ({ success: true, data, timedOut: false })),
    delay(timeoutMs).then(() => ({
      success: false,
      error: "\uC2DC\uAC04 \uCD08\uACFC",
      timedOut: true
    }))
  ]).catch((error) => ({
    success: false,
    error: error instanceof Error ? error.message : "\uC2E4\uD589 \uC911 \uC624\uB958",
    timedOut: false
  }));
}
function deepClone(obj) {
  try {
    const cloned = JSON.parse(JSON.stringify(obj));
    return { success: true, data: cloned };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "\uAC1D\uCCB4 \uBCF5\uC0AC \uC2E4\uD328"
    };
  }
}
function chunk(array, size) {
  if (size <= 0) return [];
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
function compact(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value != null) {
      result[key] = value;
    }
  }
  return result;
}
function shallowEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;
  if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }
  return true;
}
var CORE_MODULE_INFO = {
  name: "@company/core",
  version: "1.0.0",
  description: "Enterprise AI Module System - Core Foundation",
  author: "Enterprise AI Team",
  license: "MIT"
};
export {
  CORE_MODULE_INFO,
  CommonErrorCodes,
  ErrorHandler,
  EventBus,
  EventEmitter,
  LogLevel,
  Logger,
  ModuleBase,
  ModuleRegistry,
  ModuleStatus,
  chunk,
  compact,
  deepClone,
  delay,
  getErrorCode,
  getErrorMessage,
  globalLogger,
  isModuleError,
  moduleRegistry,
  retry,
  safeJsonParse,
  safeJsonStringify,
  shallowEqual,
  withTimeout
};
