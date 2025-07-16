/**
 * @repo/core - 핵심 타입 정의
 * Zero Error Architecture 기반 타입 시스템
 */
export var ModuleStatus;
(function (ModuleStatus) {
    ModuleStatus["LOADING"] = "loading";
    ModuleStatus["LOADED"] = "loaded";
    ModuleStatus["ERROR"] = "error";
    ModuleStatus["DISABLED"] = "disabled";
})(ModuleStatus || (ModuleStatus = {}));
export var CommonErrorCodes;
(function (CommonErrorCodes) {
    // System Errors (900~999)
    CommonErrorCodes["SYSTEM_INTERNAL_ERROR"] = "SYSTEM_900";
    CommonErrorCodes["SYSTEM_MAINTENANCE"] = "SYSTEM_901";
    CommonErrorCodes["SYSTEM_TIMEOUT"] = "SYSTEM_902";
    // Validation Errors (800~899)
    CommonErrorCodes["VALIDATION_FAILED"] = "VAL_800";
    CommonErrorCodes["INVALID_FORMAT"] = "VAL_801";
    CommonErrorCodes["REQUIRED_FIELD_MISSING"] = "VAL_802";
    // Network Errors (700~799)
    CommonErrorCodes["NETWORK_ERROR"] = "NET_700";
    CommonErrorCodes["API_UNAVAILABLE"] = "NET_701";
    CommonErrorCodes["RATE_LIMIT_EXCEEDED"] = "NET_702";
})(CommonErrorCodes || (CommonErrorCodes = {}));
// ===== 로깅 시스템 =====
export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (LogLevel = {}));
//# sourceMappingURL=index.js.map