/**
 * QR 코드 생성기 - TOTP 설정용 QR 코드 생성
 */

import QRCode from 'qrcode';

export interface QrCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export class QrCodeGenerator {
  private defaultOptions: QrCodeOptions = {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  };

  /**
   * Data URL로 QR 코드 생성
   */
  async generateDataUrl(
    totpUri: string, 
    options?: QrCodeOptions
  ): Promise<string> {
    const finalOptions = { ...this.defaultOptions, ...options };
    
    try {
      return await QRCode.toDataURL(totpUri, finalOptions);
    } catch (error) {
      throw new Error(`QR 코드 생성 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * SVG 형태로 QR 코드 생성
   */
  async generateSvg(
    totpUri: string, 
    options?: QrCodeOptions
  ): Promise<string> {
    const finalOptions = { ...this.defaultOptions, ...options };
    
    try {
      return await QRCode.toString(totpUri, { 
        ...finalOptions,
        type: 'svg' 
      });
    } catch (error) {
      throw new Error(`SVG QR 코드 생성 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 터미널용 ASCII QR 코드 생성
   */
  async generateTerminal(totpUri: string): Promise<string> {
    try {
      return await QRCode.toString(totpUri, { type: 'terminal' });
    } catch (error) {
      throw new Error(`터미널 QR 코드 생성 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Buffer로 QR 코드 생성 (PNG)
   */
  async generateBuffer(
    totpUri: string, 
    options?: QrCodeOptions
  ): Promise<Buffer> {
    const finalOptions = { ...this.defaultOptions, ...options };
    
    try {
      return await QRCode.toBuffer(totpUri, finalOptions);
    } catch (error) {
      throw new Error(`Buffer QR 코드 생성 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * QR 코드 크기 계산
   */
  calculateSize(version: number): number {
    // QR 코드 버전에 따른 크기 계산
    return 21 + (version - 1) * 4;
  }

  /**
   * 데이터 길이에 따른 최적 버전 추천
   */
  recommendVersion(dataLength: number): number {
    // 데이터 길이에 따른 최적 QR 코드 버전 추천
    if (dataLength <= 25) return 1;
    if (dataLength <= 47) return 2;
    if (dataLength <= 77) return 3;
    if (dataLength <= 114) return 4;
    if (dataLength <= 154) return 5;
    return 6; // 일반적인 TOTP URI는 6버전 이하면 충분
  }

  /**
   * 사용자 정의 로고와 함께 QR 코드 생성
   */
  async generateWithLogo(
    totpUri: string,
    logoDataUrl: string,
    options?: QrCodeOptions
  ): Promise<string> {
    // 기본 QR 코드 생성
    const qrDataUrl = await this.generateDataUrl(totpUri, options);
    
    // Canvas를 사용한 로고 오버레이는 브라우저 환경에서만 가능
    // 서버 환경에서는 이미지 처리 라이브러리 필요
    return qrDataUrl; // 현재는 기본 QR 코드만 반환
  }

  /**
   * 기본 옵션 업데이트
   */
  updateDefaultOptions(options: Partial<QrCodeOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  /**
   * 현재 기본 옵션 조회
   */
  getDefaultOptions(): QrCodeOptions {
    return { ...this.defaultOptions };
  }
}