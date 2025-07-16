import { nanoid } from 'nanoid';
import { DatabaseAdapter } from '../adapters';
import { Logger } from '../core';
import { 
  EmailVerification,
  EmailChangeRequest,
  EmailChangeInput,
  ServiceResponse, 
  UserAccountError, 
  UserAccountErrorCode,
  SecurityEvent,
  SecurityEventType,
  emailChangeSchema 
} from '../types';

export class EmailManager {
  private readonly logger = new Logger('EmailManager');
  private readonly tokenExpiryHours = 24;

  constructor(private readonly db: DatabaseAdapter) {}

  async requestEmailChange(userId: string, input: EmailChangeInput): Promise<ServiceResponse<EmailChangeRequest>> {
    try {
      this.logger.info('Requesting email change', { userId, newEmail: input.newEmail });

      // Validate input
      const validatedInput = emailChangeSchema.parse(input);

      // Check if user exists
      const user = await this.findUserById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User account not found',
          code: UserAccountErrorCode.NOT_FOUND
        };
      }

      // Check if new email already exists
      const emailExists = await this.checkEmailExists(validatedInput.newEmail);
      if (emailExists) {
        throw new UserAccountError(
          UserAccountErrorCode.EMAIL_ALREADY_EXISTS,
          'An account with this email already exists'
        );
      }

      // Cancel any existing email change requests
      await this.cancelPendingEmailChangeRequests(userId);

      // Create new email change request
      const changeRequest: EmailChangeRequest = {
        id: nanoid(),
        userId,
        currentEmail: user.email,
        newEmail: validatedInput.newEmail,
        verificationToken: this.generateVerificationToken(),
        expiresAt: new Date(Date.now() + this.tokenExpiryHours * 60 * 60 * 1000),
        createdAt: new Date()
      };

      await this.saveEmailChangeRequest(changeRequest);

      // Log security event
      await this.logSecurityEvent(userId, SecurityEventType.EMAIL_CHANGED, 
        `Email change requested from ${user.email} to ${validatedInput.newEmail}`);

      this.logger.info('Email change request created', { 
        requestId: changeRequest.id, 
        userId,
        newEmail: validatedInput.newEmail 
      });

      return {
        success: true,
        data: changeRequest
      };

    } catch (error) {
      this.logger.error('Failed to request email change', error);

      if (error instanceof UserAccountError) {
        return {
          success: false,
          error: error.message,
          code: error.code
        };
      }

      return {
        success: false,
        error: 'Failed to request email change',
        code: UserAccountErrorCode.INTERNAL_ERROR
      };
    }
  }

  async confirmEmailChange(token: string): Promise<ServiceResponse<boolean>> {
    try {
      this.logger.info('Confirming email change', { token: token.substring(0, 8) + '...' });

      // Find email change request
      const changeRequest = await this.findEmailChangeRequest(token);
      if (!changeRequest) {
        return {
          success: false,
          error: 'Invalid or expired email change token',
          code: UserAccountErrorCode.INVALID_RESET_TOKEN
        };
      }

      // Check if token is expired
      if (new Date() > changeRequest.expiresAt) {
        await this.deleteEmailChangeRequest(changeRequest.id);
        return {
          success: false,
          error: 'Email change token has expired',
          code: UserAccountErrorCode.RESET_TOKEN_EXPIRED
        };
      }

      // Check if new email is still available
      const emailExists = await this.checkEmailExists(changeRequest.newEmail);
      if (emailExists) {
        await this.deleteEmailChangeRequest(changeRequest.id);
        return {
          success: false,
          error: 'Email is no longer available',
          code: UserAccountErrorCode.EMAIL_ALREADY_EXISTS
        };
      }

      // Begin transaction
      await this.db.beginTransaction();

      try {
        // Update user email
        await this.updateUserEmail(changeRequest.userId, changeRequest.newEmail);

        // Delete the change request
        await this.deleteEmailChangeRequest(changeRequest.id);

        // Log security event
        await this.logSecurityEvent(changeRequest.userId, SecurityEventType.EMAIL_CHANGED,
          `Email changed from ${changeRequest.currentEmail} to ${changeRequest.newEmail}`);

        await this.db.commitTransaction();

        this.logger.info('Email change confirmed successfully', { 
          userId: changeRequest.userId,
          oldEmail: changeRequest.currentEmail,
          newEmail: changeRequest.newEmail 
        });

        return {
          success: true,
          data: true
        };

      } catch (error) {
        await this.db.rollbackTransaction();
        throw error;
      }

    } catch (error) {
      this.logger.error('Failed to confirm email change', error);
      return {
        success: false,
        error: 'Failed to confirm email change',
        code: UserAccountErrorCode.INTERNAL_ERROR
      };
    }
  }

  async sendEmailVerification(userId: string): Promise<ServiceResponse<EmailVerification>> {
    try {
      this.logger.info('Sending email verification', { userId });

      // Check if user exists
      const user = await this.findUserById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User account not found',
          code: UserAccountErrorCode.NOT_FOUND
        };
      }

      if (user.emailVerified) {
        return {
          success: false,
          error: 'Email is already verified',
          code: UserAccountErrorCode.VALIDATION_ERROR
        };
      }

      // Cancel any existing verification requests
      await this.cancelPendingEmailVerifications(user.email);

      // Create new email verification
      const verification: EmailVerification = {
        id: nanoid(),
        email: user.email,
        token: this.generateVerificationToken(),
        verified: false,
        expiresAt: new Date(Date.now() + this.tokenExpiryHours * 60 * 60 * 1000),
        createdAt: new Date()
      };

      await this.saveEmailVerification(verification);

      this.logger.info('Email verification created', { 
        verificationId: verification.id,
        email: user.email 
      });

      return {
        success: true,
        data: verification
      };

    } catch (error) {
      this.logger.error('Failed to send email verification', error);
      return {
        success: false,
        error: 'Failed to send email verification',
        code: UserAccountErrorCode.INTERNAL_ERROR
      };
    }
  }

  async verifyEmail(token: string): Promise<ServiceResponse<boolean>> {
    try {
      this.logger.info('Verifying email', { token: token.substring(0, 8) + '...' });

      // Find email verification
      const verification = await this.findEmailVerification(token);
      if (!verification) {
        return {
          success: false,
          error: 'Invalid or expired verification token',
          code: UserAccountErrorCode.INVALID_RESET_TOKEN
        };
      }

      // Check if token is expired
      if (new Date() > verification.expiresAt) {
        await this.deleteEmailVerification(verification.id);
        return {
          success: false,
          error: 'Verification token has expired',
          code: UserAccountErrorCode.RESET_TOKEN_EXPIRED
        };
      }

      if (verification.verified) {
        return {
          success: false,
          error: 'Email is already verified',
          code: UserAccountErrorCode.VALIDATION_ERROR
        };
      }

      // Begin transaction
      await this.db.beginTransaction();

      try {
        // Mark email as verified
        await this.markEmailVerified(verification.email);

        // Mark verification as used
        await this.markVerificationUsed(verification.id);

        // Log security event
        const user = await this.findUserByEmail(verification.email);
        if (user) {
          await this.logSecurityEvent(user.id, SecurityEventType.EMAIL_VERIFIED,
            `Email ${verification.email} verified successfully`);
        }

        await this.db.commitTransaction();

        this.logger.info('Email verified successfully', { email: verification.email });

        return {
          success: true,
          data: true
        };

      } catch (error) {
        await this.db.rollbackTransaction();
        throw error;
      }

    } catch (error) {
      this.logger.error('Failed to verify email', error);
      return {
        success: false,
        error: 'Failed to verify email',
        code: UserAccountErrorCode.INTERNAL_ERROR
      };
    }
  }

  private generateVerificationToken(): string {
    return nanoid(32);
  }

  private async findUserById(id: string): Promise<any | null> {
    const query = `SELECT * FROM user_accounts WHERE id = ? AND deleted_at IS NULL`;
    return await this.db.queryOne(query, [id]);
  }

  private async findUserByEmail(email: string): Promise<any | null> {
    const query = `SELECT * FROM user_accounts WHERE email = ? AND deleted_at IS NULL`;
    return await this.db.queryOne(query, [email]);
  }

  private async checkEmailExists(email: string): Promise<boolean> {
    const query = `SELECT 1 FROM user_accounts WHERE email = ? AND deleted_at IS NULL LIMIT 1`;
    const result = await this.db.queryOne(query, [email]);
    return !!result;
  }

  private async saveEmailChangeRequest(request: EmailChangeRequest): Promise<void> {
    const query = `
      INSERT INTO email_change_requests 
      (id, user_id, current_email, new_email, verification_token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.execute(query, [
      request.id,
      request.userId,
      request.currentEmail,
      request.newEmail,
      request.verificationToken,
      request.expiresAt,
      request.createdAt
    ]);
  }

  private async findEmailChangeRequest(token: string): Promise<EmailChangeRequest | null> {
    const query = `SELECT * FROM email_change_requests WHERE verification_token = ?`;
    return await this.db.queryOne<EmailChangeRequest>(query, [token]);
  }

  private async deleteEmailChangeRequest(id: string): Promise<void> {
    const query = `DELETE FROM email_change_requests WHERE id = ?`;
    await this.db.execute(query, [id]);
  }

  private async cancelPendingEmailChangeRequests(userId: string): Promise<void> {
    const query = `DELETE FROM email_change_requests WHERE user_id = ?`;
    await this.db.execute(query, [userId]);
  }

  private async updateUserEmail(userId: string, newEmail: string): Promise<void> {
    const query = `
      UPDATE user_accounts 
      SET email = ?, email_verified = false, updated_at = ?
      WHERE id = ?
    `;
    await this.db.execute(query, [newEmail, new Date(), userId]);
  }

  private async saveEmailVerification(verification: EmailVerification): Promise<void> {
    const query = `
      INSERT INTO email_verifications 
      (id, email, token, verified, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await this.db.execute(query, [
      verification.id,
      verification.email,
      verification.token,
      verification.verified,
      verification.expiresAt,
      verification.createdAt
    ]);
  }

  private async findEmailVerification(token: string): Promise<EmailVerification | null> {
    const query = `SELECT * FROM email_verifications WHERE token = ?`;
    return await this.db.queryOne<EmailVerification>(query, [token]);
  }

  private async deleteEmailVerification(id: string): Promise<void> {
    const query = `DELETE FROM email_verifications WHERE id = ?`;
    await this.db.execute(query, [id]);
  }

  private async cancelPendingEmailVerifications(email: string): Promise<void> {
    const query = `DELETE FROM email_verifications WHERE email = ? AND verified = false`;
    await this.db.execute(query, [email]);
  }

  private async markEmailVerified(email: string): Promise<void> {
    const query = `
      UPDATE user_accounts 
      SET email_verified = true, updated_at = ?
      WHERE email = ?
    `;
    await this.db.execute(query, [new Date(), email]);
  }

  private async markVerificationUsed(id: string): Promise<void> {
    const query = `
      UPDATE email_verifications 
      SET verified = true, verified_at = ?
      WHERE id = ?
    `;
    await this.db.execute(query, [new Date(), id]);
  }

  private async logSecurityEvent(userId: string, eventType: SecurityEventType, description: string): Promise<void> {
    const event: SecurityEvent = {
      id: nanoid(),
      userId,
      eventType,
      description,
      createdAt: new Date()
    };

    const query = `
      INSERT INTO security_events 
      (id, user_id, event_type, description, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    await this.db.execute(query, [
      event.id,
      event.userId,
      event.eventType,
      event.description,
      event.createdAt
    ]);
  }
}