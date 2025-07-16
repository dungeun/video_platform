import crypto from 'crypto';
import { SignatureError } from '../types';

interface SignatureData {
  type: 'drawn' | 'typed' | 'uploaded' | 'digital';
  data: string;
}

interface DigitalCertificate {
  publicKey: string;
  privateKey: string;
  certificate: string;
}

export class SignatureService {
  private certificates: Map<string, DigitalCertificate> = new Map();

  async verifySignature(signature: SignatureData): Promise<boolean> {
    try {
      switch (signature.type) {
        case 'drawn':
          return this.verifyDrawnSignature(signature.data);
        case 'typed':
          return this.verifyTypedSignature(signature.data);
        case 'uploaded':
          return this.verifyUploadedSignature(signature.data);
        case 'digital':
          return this.verifyDigitalSignature(signature.data);
        default:
          throw new SignatureError('Invalid signature type');
      }
    } catch (error: any) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  private verifyDrawnSignature(data: string): boolean {
    // Verify base64 image data
    if (!data.startsWith('data:image/')) {
      return false;
    }

    // Check image size and format
    const base64Data = data.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Basic validation - check if it's a valid image
    return buffer.length > 100 && buffer.length < 5 * 1024 * 1024; // Max 5MB
  }

  private verifyTypedSignature(data: string): boolean {
    // Verify typed signature has minimum length
    return data.trim().length >= 3;
  }

  private verifyUploadedSignature(data: string): boolean {
    // Similar to drawn signature verification
    return this.verifyDrawnSignature(data);
  }

  private verifyDigitalSignature(data: string): boolean {
    // Verify using digital certificate
    try {
      const signatureData = JSON.parse(data);
      const { message, signature, certificateId } = signatureData;

      const certificate = this.certificates.get(certificateId);
      if (!certificate) {
        return false;
      }

      const verify = crypto.createVerify('SHA256');
      verify.update(message);
      verify.end();

      return verify.verify(certificate.publicKey, signature, 'hex');
    } catch (error) {
      return false;
    }
  }

  async createDigitalSignature(
    message: string,
    certificateId: string
  ): Promise<string> {
    const certificate = this.certificates.get(certificateId);
    if (!certificate) {
      throw new SignatureError('Certificate not found');
    }

    const sign = crypto.createSign('SHA256');
    sign.update(message);
    sign.end();

    const signature = sign.sign(certificate.privateKey, 'hex');

    return JSON.stringify({
      message,
      signature,
      certificateId,
      timestamp: new Date().toISOString()
    });
  }

  async generateCertificate(userId: string): Promise<string> {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    const certificateId = crypto.randomBytes(16).toString('hex');
    
    // In production, this would generate a proper X.509 certificate
    const certificate: DigitalCertificate = {
      publicKey,
      privateKey,
      certificate: `-----BEGIN CERTIFICATE-----
${Buffer.from(JSON.stringify({
  subject: userId,
  publicKey: publicKey.replace(/-----.*-----/g, '').trim(),
  validFrom: new Date().toISOString(),
  validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
})).toString('base64')}
-----END CERTIFICATE-----`
    };

    this.certificates.set(certificateId, certificate);
    return certificateId;
  }

  validateSignatureImage(imageData: string): {
    valid: boolean;
    error?: string;
  } {
    try {
      // Check if it's a valid base64 image
      if (!imageData.match(/^data:image\/(png|jpeg|jpg);base64,/)) {
        return { valid: false, error: 'Invalid image format' };
      }

      // Extract base64 data
      const base64Data = imageData.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');

      // Check size
      if (buffer.length > 5 * 1024 * 1024) {
        return { valid: false, error: 'Image too large (max 5MB)' };
      }

      if (buffer.length < 100) {
        return { valid: false, error: 'Image too small' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid image data' };
    }
  }

  generateSignatureHash(
    signatureData: string,
    additionalData?: Record<string, any>
  ): string {
    const dataToHash = {
      signature: signatureData,
      timestamp: new Date().toISOString(),
      ...additionalData
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(dataToHash))
      .digest('hex');
  }
}