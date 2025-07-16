"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileCarrierService = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("../types");
/**
 * 통신사 본인인증 서비스
 * SKT, KT, LGU+ 통신사를 통한 본인인증 처리
 */
class MobileCarrierService {
    constructor(config) {
        this.clients = new Map();
        this.apiKeys = new Map();
        // SKT 설정
        if (config.skt) {
            this.clients.set(types_1.MobileCarrier.SKT, axios_1.default.create({
                baseURL: config.skt.endpoint,
                timeout: 30000
            }));
            this.apiKeys.set(types_1.MobileCarrier.SKT, config.skt.apiKey);
        }
        // KT 설정
        if (config.kt) {
            this.clients.set(types_1.MobileCarrier.KT, axios_1.default.create({
                baseURL: config.kt.endpoint,
                timeout: 30000
            }));
            this.apiKeys.set(types_1.MobileCarrier.KT, config.kt.apiKey);
        }
        // LGU+ 설정
        if (config.lgu) {
            this.clients.set(types_1.MobileCarrier.LGU, axios_1.default.create({
                baseURL: config.lgu.endpoint,
                timeout: 30000
            }));
            this.apiKeys.set(types_1.MobileCarrier.LGU, config.lgu.apiKey);
        }
    }
    /**
     * 통신사 본인인증 요청
     */
    async requestVerification(request) {
        try {
            // 통신사 확인
            const carrier = request.carrier || await this.detectCarrier(request.phoneNumber);
            if (!carrier || carrier === types_1.MobileCarrier.MVNO) {
                throw new Error('지원하지 않는 통신사입니다.');
            }
            const client = this.clients.get(carrier);
            const apiKey = this.apiKeys.get(carrier);
            if (!client || !apiKey) {
                throw new Error(`${carrier} 통신사 설정이 없습니다.`);
            }
            // 인증 요청
            const response = await this.sendVerificationRequest(client, apiKey, carrier, request);
            return {
                verificationId: response.authId,
                status: types_1.VerificationStatus.IN_PROGRESS,
                token: response.token,
                authUrl: response.authUrl,
                expiresAt: new Date(Date.now() + 300000) // 5분
            };
        }
        catch (error) {
            console.error('[Mobile Carrier] Request verification error:', error);
            return {
                verificationId: '',
                status: types_1.VerificationStatus.FAILED,
                error: this.handleError(error)
            };
        }
    }
    /**
     * 통신사별 인증 요청 전송
     */
    async sendVerificationRequest(client, apiKey, carrier, request) {
        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };
        // 통신사별 API 형식에 맞춰 요청 데이터 구성
        let requestData;
        switch (carrier) {
            case types_1.MobileCarrier.SKT:
                requestData = {
                    service_type: 'AUTH',
                    user_name: request.name,
                    user_birthday: request.birthDate,
                    user_gender: request.gender === 'M' ? '1' : '2',
                    user_phone: this.formatPhoneNumber(request.phoneNumber),
                    user_nation: request.nationality === 'foreigner' ? 'F' : 'K',
                    callback_url: request.returnUrl
                };
                break;
            case types_1.MobileCarrier.KT:
                requestData = {
                    authType: 'PHONE',
                    name: request.name,
                    birthDate: request.birthDate,
                    gender: request.gender,
                    phoneNumber: this.formatPhoneNumber(request.phoneNumber),
                    foreigner: request.nationality === 'foreigner',
                    returnUrl: request.returnUrl
                };
                break;
            case types_1.MobileCarrier.LGU:
                requestData = {
                    auth_type: 'mobile',
                    cust_name: request.name,
                    birth_date: request.birthDate,
                    sex_code: request.gender,
                    phone_no: this.formatPhoneNumber(request.phoneNumber),
                    nation_code: request.nationality === 'foreigner' ? '2' : '1',
                    redirect_url: request.returnUrl
                };
                break;
        }
        const response = await client.post('/auth/request', requestData, { headers });
        return response.data;
    }
    /**
     * 인증 상태 확인
     */
    async checkStatus(verificationId, carrier) {
        try {
            const client = this.clients.get(carrier);
            const apiKey = this.apiKeys.get(carrier);
            if (!client || !apiKey) {
                throw new Error(`${carrier} 통신사 설정이 없습니다.`);
            }
            const response = await client.get(`/auth/status/${verificationId}`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            return {
                verificationId,
                status: this.mapStatus(response.data.status),
                expiresAt: response.data.expiresAt ? new Date(response.data.expiresAt) : undefined
            };
        }
        catch (error) {
            console.error('[Mobile Carrier] Check status error:', error);
            return {
                verificationId,
                status: types_1.VerificationStatus.FAILED,
                error: this.handleError(error)
            };
        }
    }
    /**
     * 인증 결과 조회
     */
    async getResult(verificationId, token, carrier) {
        try {
            const client = this.clients.get(carrier);
            const apiKey = this.apiKeys.get(carrier);
            if (!client || !apiKey) {
                throw new Error(`${carrier} 통신사 설정이 없습니다.`);
            }
            const response = await client.post('/auth/result', {
                authId: verificationId,
                authToken: token
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            if (response.data.success) {
                const identity = {
                    ci: response.data.ci,
                    di: response.data.di,
                    name: response.data.name,
                    birthDate: response.data.birthDate,
                    gender: response.data.gender,
                    phoneNumber: response.data.phoneNumber,
                    carrier,
                    nationality: response.data.foreigner ? 'foreigner' : 'korean',
                    isAdult: this.checkAdult(response.data.birthDate),
                    verifiedAt: new Date(),
                    verificationMethod: types_1.VerificationMethod.MOBILE_CARRIER
                };
                return {
                    success: true,
                    verificationId,
                    identity,
                    timestamp: new Date()
                };
            }
            else {
                return {
                    success: false,
                    verificationId,
                    error: {
                        code: types_1.VerificationErrorCode.VERIFICATION_FAILED,
                        message: response.data.message || '인증에 실패했습니다.'
                    },
                    timestamp: new Date()
                };
            }
        }
        catch (error) {
            console.error('[Mobile Carrier] Get result error:', error);
            return {
                success: false,
                verificationId,
                error: this.handleError(error),
                timestamp: new Date()
            };
        }
    }
    /**
     * 통신사 자동 감지
     */
    async detectCarrier(phoneNumber) {
        const cleaned = phoneNumber.replace(/[^0-9]/g, '');
        const prefix = cleaned.substring(0, 3);
        // 통신사별 식별번호 (간단한 예시)
        const carrierPrefixes = {
            '010': types_1.MobileCarrier.SKT, // 실제로는 더 복잡한 로직 필요
            '011': types_1.MobileCarrier.SKT,
            '016': types_1.MobileCarrier.KT,
            '019': types_1.MobileCarrier.LGU
        };
        // 실제 구현에서는 번호이동 DB 조회 필요
        return carrierPrefixes[prefix] || null;
    }
    /**
     * 휴대폰 번호 포맷팅
     */
    formatPhoneNumber(phoneNumber) {
        const cleaned = phoneNumber.replace(/[^0-9]/g, '');
        return cleaned;
    }
    /**
     * 성인 여부 확인
     */
    checkAdult(birthDate) {
        const year = parseInt(birthDate.substring(0, 4));
        const month = parseInt(birthDate.substring(4, 6));
        const day = parseInt(birthDate.substring(6, 8));
        const birth = new Date(year, month - 1, day);
        const today = new Date();
        const age = today.getFullYear() - birth.getFullYear();
        if (age > 19)
            return true;
        if (age < 19)
            return false;
        return today.getMonth() > birth.getMonth() ||
            (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
    }
    /**
     * 상태 매핑
     */
    mapStatus(apiStatus) {
        const statusMap = {
            'WAITING': types_1.VerificationStatus.IN_PROGRESS,
            'PROCESSING': types_1.VerificationStatus.VERIFYING,
            'COMPLETE': types_1.VerificationStatus.SUCCESS,
            'FAIL': types_1.VerificationStatus.FAILED,
            'TIMEOUT': types_1.VerificationStatus.EXPIRED,
            'CANCEL': types_1.VerificationStatus.CANCELLED
        };
        return statusMap[apiStatus] || types_1.VerificationStatus.FAILED;
    }
    /**
     * 오류 처리
     */
    handleError(error) {
        if (axios_1.default.isAxiosError(error)) {
            const status = error.response?.status;
            if (status === 400) {
                return {
                    code: types_1.VerificationErrorCode.INVALID_REQUEST,
                    message: '잘못된 요청입니다.'
                };
            }
            else if (status === 401) {
                return {
                    code: types_1.VerificationErrorCode.SERVICE_UNAVAILABLE,
                    message: '인증 서비스에 접근할 수 없습니다.'
                };
            }
        }
        return {
            code: types_1.VerificationErrorCode.UNKNOWN_ERROR,
            message: error.message || '알 수 없는 오류가 발생했습니다.'
        };
    }
}
exports.MobileCarrierService = MobileCarrierService;
//# sourceMappingURL=MobileCarrierService.js.map