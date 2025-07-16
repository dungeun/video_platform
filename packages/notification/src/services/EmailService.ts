import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import sgMail from '@sendgrid/mail';
import { 
  EmailProvider, 
  NotificationContent, 
  NotificationRecipient,
  DeliveryStatus 
} from '../types';

export interface EmailServiceConfig {
  provider: EmailProvider;
  defaultFrom: string;
  defaultReplyTo?: string;
}

export class EmailService {
  private sesClient?: SESClient;
  private config: EmailServiceConfig;

  constructor(config: EmailServiceConfig) {
    this.config = config;
    this.initializeProvider();
  }

  private initializeProvider(): void {
    switch (this.config.provider.type) {
      case 'ses':
        this.sesClient = new SESClient(this.config.provider.config);
        break;
      case 'sendgrid':
        if (this.config.provider.config.apiKey) {
          sgMail.setApiKey(this.config.provider.config.apiKey);
        }
        break;
      case 'smtp':
        // SMTP 구성은 nodemailer로 처리 가능
        break;
    }
  }

  async send(
    recipient: NotificationRecipient,
    content: NotificationContent,
    options?: {
      from?: string;
      replyTo?: string;
      cc?: string[];
      bcc?: string[];
      tags?: string[];
    }
  ): Promise<{
    status: DeliveryStatus;
    messageId?: string;
    error?: string;
  }> {
    if (!recipient.email) {
      throw new Error('Email recipient is required');
    }

    try {
      switch (this.config.provider.type) {
        case 'ses':
          return await this.sendWithSES(recipient.email, content, options);
        case 'sendgrid':
          return await this.sendWithSendGrid(recipient.email, content, options);
        default:
          throw new Error(`Unsupported email provider: ${this.config.provider.type}`);
      }
    } catch (error) {
      return {
        status: DeliveryStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async sendWithSES(
    to: string,
    content: NotificationContent,
    options?: any
  ): Promise<{ status: DeliveryStatus; messageId?: string; error?: string }> {
    if (!this.sesClient) {
      throw new Error('SES client not initialized');
    }

    const params = {
      Source: options?.from || this.config.defaultFrom,
      Destination: {
        ToAddresses: [to],
        CcAddresses: options?.cc,
        BccAddresses: options?.bcc
      },
      Message: {
        Subject: {
          Data: content.subject || 'No Subject',
          Charset: 'UTF-8'
        },
        Body: {
          Text: {
            Data: content.body,
            Charset: 'UTF-8'
          },
          Html: content.html ? {
            Data: content.html,
            Charset: 'UTF-8'
          } : undefined
        }
      },
      ReplyToAddresses: options?.replyTo ? [options.replyTo] : undefined,
      Tags: options?.tags?.map(tag => ({ Name: tag, Value: 'true' }))
    };

    try {
      const command = new SendEmailCommand(params);
      const response = await this.sesClient.send(command);
      
      return {
        status: DeliveryStatus.SENT,
        messageId: response.MessageId
      };
    } catch (error) {
      throw error;
    }
  }

  private async sendWithSendGrid(
    to: string,
    content: NotificationContent,
    options?: any
  ): Promise<{ status: DeliveryStatus; messageId?: string; error?: string }> {
    const msg = {
      to,
      from: options?.from || this.config.defaultFrom,
      subject: content.subject || 'No Subject',
      text: content.body,
      html: content.html,
      cc: options?.cc,
      bcc: options?.bcc,
      replyTo: options?.replyTo,
      categories: options?.tags,
      attachments: content.attachments?.map(att => ({
        content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
        filename: att.filename,
        type: att.contentType,
        disposition: 'attachment'
      }))
    };

    try {
      const [response] = await sgMail.send(msg);
      
      return {
        status: DeliveryStatus.SENT,
        messageId: response.headers['x-message-id']
      };
    } catch (error) {
      throw error;
    }
  }

  async sendBulk(
    recipients: NotificationRecipient[],
    content: NotificationContent,
    options?: any
  ): Promise<Map<string, { status: DeliveryStatus; messageId?: string; error?: string }>> {
    const results = new Map();
    
    // SendGrid supports bulk sending natively
    if (this.config.provider.type === 'sendgrid') {
      return this.sendBulkWithSendGrid(recipients, content, options);
    }
    
    // For other providers, send individually
    for (const recipient of recipients) {
      if (recipient.email) {
        const result = await this.send(recipient, content, options);
        results.set(recipient.email, result);
      }
    }
    
    return results;
  }

  private async sendBulkWithSendGrid(
    recipients: NotificationRecipient[],
    content: NotificationContent,
    options?: any
  ): Promise<Map<string, { status: DeliveryStatus; messageId?: string; error?: string }>> {
    const results = new Map();
    const emails = recipients.filter(r => r.email).map(r => r.email!);
    
    const msg = {
      to: emails,
      from: options?.from || this.config.defaultFrom,
      subject: content.subject || 'No Subject',
      text: content.body,
      html: content.html,
      isMultiple: true
    };

    try {
      await sgMail.sendMultiple(msg);
      emails.forEach(email => {
        results.set(email, { status: DeliveryStatus.SENT });
      });
    } catch (error) {
      emails.forEach(email => {
        results.set(email, { 
          status: DeliveryStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      });
    }
    
    return results;
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}