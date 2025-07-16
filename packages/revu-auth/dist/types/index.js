import { z } from 'zod';
// 기본 프로필 스키마
export const BasicProfileSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    avatar: z.string().url().optional(),
    bio: z.string().optional(),
});
// 사용자 등록 스키마
export const UserRegistrationSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    type: z.enum(['business', 'influencer']),
    profile: BasicProfileSchema,
});
// 로그인 스키마
export const LoginCredentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
// 비밀번호 변경 스키마
export const PasswordChangeSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
});
// 인증 에러 타입
export class AuthError extends Error {
    constructor(message, code, statusCode = 400) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'AuthError';
    }
}
//# sourceMappingURL=index.js.map