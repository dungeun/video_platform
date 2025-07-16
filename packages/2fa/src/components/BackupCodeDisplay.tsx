/**
 * 백업 코드 표시 컴포넌트
 */

import React, { useState } from 'react';
import { BackupCode } from '../types';

export interface BackupCodeDisplayProps {
  codes: BackupCode[];
  onDownload?: () => void;
  onPrint?: () => void;
  onSaved?: () => void;
  showUsedCodes?: boolean;
  className?: string;
}

export const BackupCodeDisplay: React.FC<BackupCodeDisplayProps> = ({
  codes,
  onDownload,
  onPrint,
  onSaved,
  showUsedCodes = true,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  const availableCodes = codes.filter(code => !code.isUsed);
  const usedCodes = codes.filter(code => code.isUsed);

  const copyToClipboard = async () => {
    const codeText = availableCodes.map(code => code.code).join('\n');
    
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // 클립보드 API가 지원되지 않는 경우 대체 방법 사용
      const textArea = document.createElement('textarea');
      textArea.value = codeText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>백업 코드</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .codes { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; max-width: 400px; margin: 0 auto; }
            .code { padding: 10px; border: 1px solid #ccc; border-radius: 4px; text-align: center; font-family: monospace; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>2단계 인증 백업 코드</h1>
            <p>생성일: ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="codes">
            ${availableCodes.map(code => `<div class="code">${code.code}</div>`).join('')}
          </div>
          <div class="warning">
            <strong>⚠️ 중요 안내사항:</strong>
            <ul>
              <li>이 코드들을 안전한 곳에 보관하세요</li>
              <li>각 코드는 한 번만 사용할 수 있습니다</li>
              <li>다른 사람과 공유하지 마세요</li>
              <li>코드가 부족해지면 새로 생성하세요</li>
            </ul>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
    
    onPrint?.();
  };

  const downloadAsText = () => {
    const content = `2단계 인증 백업 코드
생성일: ${new Date().toLocaleString()}

백업 코드:
${availableCodes.map((code, index) => `${index + 1}. ${code.code}`).join('\n')}

⚠️ 중요 안내사항:
- 이 코드들을 안전한 곳에 보관하세요
- 각 코드는 한 번만 사용할 수 있습니다  
- 다른 사람과 공유하지 마세요
- 코드가 부족해지면 새로 생성하세요`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-codes-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    onDownload?.();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 사용 가능한 백업 코드 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">
            백업 코드 ({availableCodes.length}개 남음)
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={copyToClipboard}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              {copied ? '복사됨!' : '복사'}
            </button>
            {onDownload && (
              <button
                onClick={downloadAsText}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                다운로드
              </button>
            )}
            {onPrint && (
              <button
                onClick={handlePrint}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                인쇄
              </button>
            )}
          </div>
        </div>

        {availableCodes.length > 0 ? (
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableCodes.map((code) => (
                <div
                  key={code.id}
                  className="bg-white p-3 rounded border font-mono text-sm text-center"
                >
                  {code.code}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
            <p className="text-yellow-800 text-sm">
              ⚠️ 사용 가능한 백업 코드가 없습니다. 새로운 백업 코드를 생성하세요.
            </p>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800 text-sm">
            💡 <strong>안전 보관 팁:</strong> 백업 코드를 암호 관리자, 안전한 노트 앱, 
            또는 물리적으로 안전한 장소에 보관하세요.
          </p>
        </div>
      </div>

      {/* 사용된 백업 코드 */}
      {showUsedCodes && usedCodes.length > 0 && (
        <div>
          <h4 className="text-md font-medium mb-3 text-gray-600">
            사용된 코드 ({usedCodes.length}개)
          </h4>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {usedCodes.map((code) => (
                <div
                  key={code.id}
                  className="bg-gray-200 p-3 rounded border font-mono text-sm text-center text-gray-500 line-through"
                  title={`사용일: ${code.usedAt?.toLocaleString()}`}
                >
                  {code.code}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 확인 버튼 */}
      {onSaved && (
        <div className="text-center">
          <button
            onClick={onSaved}
            className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition-colors"
          >
            안전하게 저장했습니다
          </button>
        </div>
      )}

      {/* 경고 메시지 */}
      <div className="bg-red-50 border border-red-200 p-4 rounded-md">
        <h4 className="font-medium text-red-800 mb-2">⚠️ 중요 안내사항</h4>
        <ul className="text-sm text-red-700 space-y-1">
          <li>• 각 백업 코드는 한 번만 사용할 수 있습니다</li>
          <li>• 코드를 다른 사람과 공유하지 마세요</li>
          <li>• 코드가 3개 이하로 남으면 새로 생성하는 것을 권장합니다</li>
          <li>• 이 화면을 닫으면 코드를 다시 볼 수 없습니다</li>
        </ul>
      </div>
    </div>
  );
};