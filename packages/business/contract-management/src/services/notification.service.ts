import { EventEmitter } from 'events';
import { ContractNotification, NotificationType } from '../types';

interface EmailProvider {
  send(to: string, subject: string, body: string, attachments?: string[]): Promise<void>;
}

interface SMSProvider {
  send(to: string, message: string): Promise<void>;
}

export class NotificationService extends EventEmitter {
  private emailProvider?: EmailProvider;
  private smsProvider?: SMSProvider;
  private scheduledReminders: Map<string, NodeJS.Timeout> = new Map();

  constructor(emailProvider?: EmailProvider, smsProvider?: SMSProvider) {
    super();
    this.emailProvider = emailProvider;
    this.smsProvider = smsProvider;
  }

  async sendContractNotification(notification: ContractNotification): Promise<void> {
    try {
      // Send email notification
      if (this.emailProvider) {
        const emailBody = this.generateEmailBody(notification);
        await this.emailProvider.send(
          notification.recipientEmail,
          notification.subject,
          emailBody,
          notification.attachments
        );
      }

      // Send SMS for critical notifications
      if (this.smsProvider && this.shouldSendSMS(notification.type)) {
        const smsMessage = this.generateSMSMessage(notification);
        // Would need phone number from recipient
        // await this.smsProvider.send(recipientPhone, smsMessage);
      }

      this.emit('notification:sent', notification);
    } catch (error) {
      this.emit('notification:error', { notification, error });
      throw error;
    }
  }

  async scheduleReminder(contractId: string, reminderDate: Date): Promise<void> {
    const now = new Date();
    const delay = reminderDate.getTime() - now.getTime();

    if (delay <= 0) {
      // Send immediately if reminder date is in the past
      await this.sendReminder(contractId);
      return;
    }

    // Schedule reminder
    const timeout = setTimeout(async () => {
      await this.sendReminder(contractId);
      this.scheduledReminders.delete(contractId);
    }, delay);

    this.scheduledReminders.set(contractId, timeout);
  }

  cancelScheduledReminder(contractId: string): void {
    const timeout = this.scheduledReminders.get(contractId);
    if (timeout) {
      clearTimeout(timeout);
      this.scheduledReminders.delete(contractId);
    }
  }

  private async sendReminder(contractId: string): Promise<void> {
    // This would fetch contract details and send reminder
    const notification: ContractNotification = {
      type: NotificationType.REMINDER,
      contractId,
      recipientEmail: '', // Would be fetched from contract
      subject: 'Contract Signature Reminder',
      message: 'This is a reminder to review and sign your contract.'
    };

    await this.sendContractNotification(notification);
  }

  private generateEmailBody(notification: ContractNotification): string {
    const templates: Record<NotificationType, string> = {
      [NotificationType.CONTRACT_SENT]: `
        <h2>New Contract for Review</h2>
        <p>${notification.message}</p>
        <p>Please click the link below to review and sign the contract:</p>
        <a href="${this.getContractLink(notification.contractId)}">View Contract</a>
      `,
      [NotificationType.CONTRACT_VIEWED]: `
        <h2>Contract Viewed</h2>
        <p>${notification.message}</p>
      `,
      [NotificationType.CONTRACT_SIGNED]: `
        <h2>Contract Signed</h2>
        <p>${notification.message}</p>
        <p>You can download a copy of the signed contract here:</p>
        <a href="${this.getDownloadLink(notification.contractId)}">Download Contract</a>
      `,
      [NotificationType.CONTRACT_COMPLETED]: `
        <h2>Contract Fully Executed</h2>
        <p>${notification.message}</p>
        <p>All parties have signed the contract. You can download the final version here:</p>
        <a href="${this.getDownloadLink(notification.contractId)}">Download Contract</a>
      `,
      [NotificationType.REMINDER]: `
        <h2>Contract Signature Reminder</h2>
        <p>${notification.message}</p>
        <p>Please sign the contract as soon as possible:</p>
        <a href="${this.getContractLink(notification.contractId)}">Sign Contract</a>
      `,
      [NotificationType.EXPIRY_WARNING]: `
        <h2>Contract Expiring Soon</h2>
        <p>${notification.message}</p>
        <p>Please take action before the contract expires:</p>
        <a href="${this.getContractLink(notification.contractId)}">View Contract</a>
      `,
      [NotificationType.CONTRACT_EXPIRED]: `
        <h2>Contract Expired</h2>
        <p>${notification.message}</p>
        <p>The contract has expired and is no longer available for signing.</p>
      `
    };

    return this.wrapEmailTemplate(templates[notification.type] || notification.message);
  }

  private generateSMSMessage(notification: ContractNotification): string {
    const messages: Record<NotificationType, string> = {
      [NotificationType.CONTRACT_SENT]: 'You have a new contract to review and sign.',
      [NotificationType.CONTRACT_SIGNED]: 'Your contract has been signed successfully.',
      [NotificationType.CONTRACT_COMPLETED]: 'All parties have signed the contract.',
      [NotificationType.REMINDER]: 'Reminder: Please sign your pending contract.',
      [NotificationType.EXPIRY_WARNING]: 'Your contract is expiring soon.',
      [NotificationType.CONTRACT_EXPIRED]: 'Your contract has expired.',
      [NotificationType.CONTRACT_VIEWED]: 'Your contract has been viewed.'
    };

    return messages[notification.type] || 'Contract update available.';
  }

  private shouldSendSMS(type: NotificationType): boolean {
    // Only send SMS for critical notifications
    return [
      NotificationType.CONTRACT_SENT,
      NotificationType.REMINDER,
      NotificationType.EXPIRY_WARNING
    ].includes(type);
  }

  private getContractLink(contractId: string): string {
    // In production, this would generate actual links
    return `${process.env.APP_URL}/contracts/${contractId}`;
  }

  private getDownloadLink(contractId: string): string {
    return `${process.env.APP_URL}/contracts/${contractId}/download`;
  }

  private wrapEmailTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          h2 { color: #2c5aa0; }
          a { 
            display: inline-block; 
            padding: 10px 20px; 
            background-color: #2c5aa0; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin-top: 10px;
          }
          .footer { 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #ddd; 
            font-size: 12px; 
            color: #666; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${content}
          <div class="footer">
            <p>This is an automated message from LinkPick Contract Management.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}