"use strict";
/**
 * @company/auth - Pure Authentication Types
 * Ultra-Fine-Grained Module - Login/Logout Only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthErrorCode = exports.AuthEventType = exports.AuthStatus = void 0;
// ===== 인증 상태 타입 =====
var AuthStatus;
(function (AuthStatus) {
    AuthStatus["LOADING"] = "loading";
    AuthStatus["AUTHENTICATED"] = "authenticated";
    AuthStatus["UNAUTHENTICATED"] = "unauthenticated";
    AuthStatus["ERROR"] = "error";
})(AuthStatus || (exports.AuthStatus = AuthStatus = {}));
// ===== 이벤트 타입 =====
var AuthEventType;
(function (AuthEventType) {
    AuthEventType["LOGIN"] = "auth.login";
    AuthEventType["LOGOUT"] = "auth.logout";
    AuthEventType["SESSION_EXPIRED"] = "auth.session.expired";
    AuthEventType["TOKEN_REFRESHED"] = "auth.token.refreshed";
})(AuthEventType || (exports.AuthEventType = AuthEventType = {}));
// ===== 에러 타입 =====
var AuthErrorCode;
(function (AuthErrorCode) {
    AuthErrorCode["INVALID_CREDENTIALS"] = "AUTH_001";
    AuthErrorCode["TOKEN_EXPIRED"] = "AUTH_005";
    AuthErrorCode["TOKEN_INVALID"] = "AUTH_006";
    AuthErrorCode["SESSION_EXPIRED"] = "AUTH_007";
    AuthErrorCode["NETWORK_ERROR"] = "AUTH_008";
    AuthErrorCode["UNKNOWN_ERROR"] = "AUTH_999";
})(AuthErrorCode || (exports.AuthErrorCode = AuthErrorCode = {}));
