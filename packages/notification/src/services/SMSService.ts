import axios, { AxiosInstance } from 'axios';
import {
  SMSProvider,
  NotificationRecipient,
  DeliveryStatus,
  KoreanSMSRequest,
  AligoSMSResponse,
  SolutionBoxSMSResponse
} from '../types';

export interface SMSServiceConfig {
  provider: SMSProvider;
  defaultSender: string;
  testMode?: boolean;
}

export class SMSService {
  private config: SMSServiceConfig;
  private httpClient: AxiosInstance;

  constructor(config: SMSServiceConfig) {
    this.config = config;
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }

  async send(
    recipient: NotificationRecipient,
    message: string,
    options?: {
      sender?: string;
      title?: string;
      scheduledAt?: Date;
    }
  ): Promise<{
    status: DeliveryStatus;
    messageId?: string;
    error?: string;
    remainingCredits?: number;
  }> {
    if (!recipient.phone) {
      throw new Error('Phone number is required for SMS');
    }

    const phoneNumber = this.normalizePhoneNumber(recipient.phone);
    if (!this.validatePhoneNumber(phoneNumber)) {
      return {
        status: DeliveryStatus.FAILED,
        error: 'Invalid phone number format'
      };
    }

    try {
      switch (this.config.provider.type) {
        case 'aligo':
          return await this.sendWithAligo(phoneNumber, message, options);
        case 'solutionbox':
          return await this.sendWithSolutionBox(phoneNumber, message, options);
        default:
          throw new Error(`Unsupported SMS provider: ${this.config.provider.type}`);
      }
    } catch (error) {
      return {
        status: DeliveryStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async sendWithAligo(
    phoneNumber: string,
    message: string,
    options?: any
  ): Promise<{
    status: DeliveryStatus;
    messageId?: string;
    error?: string;
    remainingCredits?: number;
  }> {
    const { apiKey, userId, apiUrl = 'https://apis.aligo.in/send/' } = this.config.provider.config;

    if (!apiKey || !userId) {
      throw new Error('Aligo API key and user ID are required');
    }

    const messageType = this.determineMessageType(message);
    const params = new URLSearchParams({
      key: apiKey,
      user_id: userId,
      sender: options?.sender || this.config.defaultSender,
      receiver: phoneNumber,
      msg: message,
      msg_type: messageType,
      testmode_yn: this.config.testMode ? 'Y' : 'N'
    });

    if (messageType === 'LMS' && options?.title) {
      params.append('title', options.title);
    }

    try {
      const response = await this.httpClient.post<AligoSMSResponse>(
        apiUrl,
        params.toString()
      );

      const result = response.data;

      if (result.result_code === '1') {
        return {
          status: DeliveryStatus.SENT,
          messageId: result.msg_id
        };
      } else {
        return {
          status: DeliveryStatus.FAILED,
          error: result.message
        };
      }
    } catch (error) {
      throw error;
    }
  }

  private async sendWithSolutionBox(
    phoneNumber: string,
    message: string,
    options?: any
  ): Promise<{
    status: DeliveryStatus;
    messageId?: string;
    error?: string;
    remainingCredits?: number;
  }> {
    const { apiKey, apiUrl = 'https://api.solutionbox.co.kr/api/v1/sms/send' } = this.config.provider.config;

    if (!apiKey) {
      throw new Error('SolutionBox API key is required');
    }

    const messageType = this.determineMessageType(message);
    const requestBody = {
      api_key: apiKey,
      sender: options?.sender || this.config.defaultSender,
      receiver: phoneNumber,
      message: message,
      msg_type: messageType,
      title: messageType === 'LMS' ? options?.title : undefined,
      test_mode: this.config.testMode
    };

    try {
      const response = await this.httpClient.post<SolutionBoxSMSResponse>(
        apiUrl,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      const result = response.data;

      if (result.code === '0000') {
        return {
          status: DeliveryStatus.SENT,
          messageId: result.messageId,
          remainingCredits: result.remainPoint
        };
      } else {
        return {
          status: DeliveryStatus.FAILED,
          error: result.message
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async sendBulk(
    recipients: NotificationRecipient[],
    message: string,
    options?: any
  ): Promise<Map<string, {
    status: DeliveryStatus;
    messageId?: string;
    error?: string;
  }>> {
    const results = new Map();

    // Korean SMS providers typically support bulk sending
    const phoneNumbers = recipients
      .filter(r => r.phone)
      .map(r => this.normalizePhoneNumber(r.phone!))
      .filter(phone => this.validatePhoneNumber(phone));

    if (phoneNumbers.length === 0) {
      return results;
    }

    // For Aligo bulk sending
    if (this.config.provider.type === 'aligo') {
      const receiverList = phoneNumbers.join(',');
      try {
        const result = await this.sendWithAligo(receiverList, message, options);
        phoneNumbers.forEach(phone => {
          results.set(phone, result);
        });
      } catch (error) {
        phoneNumbers.forEach(phone => {
          results.set(phone, {
            status: DeliveryStatus.FAILED,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        });
      }
    } else {
      // For providers that don't support bulk, send individually
      for (const recipient of recipients) {
        if (recipient.phone) {
          const result = await this.send(recipient, message, options);
          results.set(recipient.phone, result);
        }
      }
    }

    return results;
  }

  private normalizePhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let normalized = phone.replace(/\D/g, '');

    // Add country code if not present (Korea)
    if (!normalized.startsWith('82') && normalized.startsWith('0')) {
      normalized = '82' + normalized.substring(1);
    }

    return normalized;
  }

  private validatePhoneNumber(phone: string): boolean {
    // Korean phone number validation
    // Should be 11-12 digits (with country code)
    const koreanPhoneRegex = /^82[0-9]{9,10}$/;
    return koreanPhoneRegex.test(phone);
  }

  private determineMessageType(message: string): string {
    const byteLength = Buffer.from(message, 'utf-8').length;
    
    if (byteLength <= 90) {
      return 'SMS';
    } else if (byteLength <= 2000) {
      return 'LMS';
    } else {
      return 'MMS';
    }
  }

  async checkBalance(): Promise<{
    balance?: number;
    unit?: string;
    error?: string;
  }> {
    try {
      switch (this.config.provider.type) {
        case 'aligo':
          return await this.checkAligoBalance();
        case 'solutionbox':
          return await this.checkSolutionBoxBalance();
        default:
          return { error: 'Balance check not supported for this provider' };
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkAligoBalance(): Promise<{
    balance?: number;
    unit?: string;
    error?: string;
  }> {
    const { apiKey, userId } = this.config.provider.config;
    const apiUrl = 'https://apis.aligo.in/remain/';

    const params = new URLSearchParams({
      key: apiKey,
      user_id: userId
    });

    try {
      const response = await this.httpClient.post(apiUrl, params.toString());
      const result = response.data;

      if (result.result_code === '1') {
        return {
          balance: parseInt(result.SMS_CNT),
          unit: 'messages'
        };
      } else {
        return { error: result.message };
      }
    } catch (error) {
      throw error;
    }
  }

  private async checkSolutionBoxBalance(): Promise<{
    balance?: number;
    unit?: string;
    error?: string;
  }> {
    const { apiKey } = this.config.provider.config;
    const apiUrl = 'https://api.solutionbox.co.kr/api/v1/sms/balance';

    try {
      const response = await this.httpClient.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      const result = response.data;
      if (result.code === '0000') {
        return {
          balance: result.point,
          unit: 'points'
        };
      } else {
        return { error: result.message };
      }
    } catch (error) {
      throw error;
    }
  }
}