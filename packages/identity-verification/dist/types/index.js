"use strict";
/**
 * Identity Verification Types for Korean PASS Authentication
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationErrorCode = exports.VerificationStatus = exports.MobileCarrier = exports.VerificationMethod = void 0;
/**
 * 본인인증 수단 유형
 */
var VerificationMethod;
(function (VerificationMethod) {
    VerificationMethod["PASS"] = "PASS";
    VerificationMethod["MOBILE_CARRIER"] = "MOBILE_CARRIER";
    VerificationMethod["KAKAO"] = "KAKAO";
    VerificationMethod["NAVER"] = "NAVER";
    VerificationMethod["TOSS"] = "TOSS";
    VerificationMethod["PAYCO"] = "PAYCO";
    VerificationMethod["KB"] = "KB"; // KB국민은행 인증
})(VerificationMethod || (exports.VerificationMethod = VerificationMethod = {}));
/**
 * 통신사 유형
 */
var MobileCarrier;
(function (MobileCarrier) {
    MobileCarrier["SKT"] = "SKT";
    MobileCarrier["KT"] = "KT";
    MobileCarrier["LGU"] = "LGU";
    MobileCarrier["MVNO"] = "MVNO"; // 알뜰폰
})(MobileCarrier || (exports.MobileCarrier = MobileCarrier = {}));
/**
 * 인증 상태
 */
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["IDLE"] = "IDLE";
    VerificationStatus["INITIALIZING"] = "INITIALIZING";
    VerificationStatus["IN_PROGRESS"] = "IN_PROGRESS";
    VerificationStatus["VERIFYING"] = "VERIFYING";
    VerificationStatus["SUCCESS"] = "SUCCESS";
    VerificationStatus["FAILED"] = "FAILED";
    VerificationStatus["EXPIRED"] = "EXPIRED";
    VerificationStatus["CANCELLED"] = "CANCELLED"; // 취소됨
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
/**
 * 오류 코드
 */
var VerificationErrorCode;
(function (VerificationErrorCode) {
    VerificationErrorCode["INVALID_REQUEST"] = "INVALID_REQUEST";
    VerificationErrorCode["INVALID_PHONE"] = "INVALID_PHONE";
    VerificationErrorCode["INVALID_BIRTH_DATE"] = "INVALID_BIRTH_DATE";
    VerificationErrorCode["INVALID_NAME"] = "INVALID_NAME";
    VerificationErrorCode["VERIFICATION_FAILED"] = "VERIFICATION_FAILED";
    VerificationErrorCode["SESSION_EXPIRED"] = "SESSION_EXPIRED";
    VerificationErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    VerificationErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    VerificationErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(VerificationErrorCode || (exports.VerificationErrorCode = VerificationErrorCode = {}));
//# sourceMappingURL=index.js.map