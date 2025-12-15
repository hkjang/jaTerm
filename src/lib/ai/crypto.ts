/**
 * AI API Key 암호화/복호화 유틸리티
 * AES-256-GCM 암호화 사용
 */

import crypto from 'crypto';

// 환경변수에서 마스터 키 로드 (32 bytes = 256 bits)
const ENCRYPTION_KEY = process.env.AI_ENCRYPTION_KEY || 'default-key-change-in-production!';

// Key를 32바이트로 맞추기 (SHA-256 해시)
function getKey(): Buffer {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

/**
 * API Key 암호화
 * @param plainKey 평문 API Key
 * @returns 암호화된 문자열 (iv:authTag:encrypted 형식)
 */
export function encryptApiKey(plainKey: string): string {
  if (!plainKey) return '';
  
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(plainKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // iv:authTag:encrypted 형식으로 저장
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * API Key 복호화
 * @param encryptedKey 암호화된 API Key
 * @returns 복호화된 평문 API Key
 */
export function decryptApiKey(encryptedKey: string): string {
  if (!encryptedKey) return '';
  
  try {
    const parts = encryptedKey.split(':');
    if (parts.length !== 3) {
      // 암호화되지 않은 키일 경우 그대로 반환 (마이그레이션 호환)
      return encryptedKey;
    }
    
    const [ivHex, authTagHex, encrypted] = parts;
    const key = getKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('API Key decryption failed:', error);
    // 복호화 실패시 그대로 반환 (마이그레이션 호환)
    return encryptedKey;
  }
}

/**
 * 프롬프트 해시 생성 (Audit Log용)
 * @param prompt 프롬프트 원문
 * @returns SHA-256 해시
 */
export function hashPrompt(prompt: string): string {
  return crypto.createHash('sha256').update(prompt).digest('hex');
}

/**
 * 마스킹할 민감 패턴들
 */
const SENSITIVE_PATTERNS = [
  // 비밀번호/토큰 패턴
  /(?:password|passwd|pwd|secret|token|api[_-]?key|auth)[=:\s]+['"]?[\w\-\.]+['"]?/gi,
  // IP 주소
  /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  // 이메일
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // SSH 키 패턴
  /-----BEGIN [A-Z]+ PRIVATE KEY-----[\s\S]*?-----END [A-Z]+ PRIVATE KEY-----/g,
];

/**
 * 민감 정보 마스킹
 * @param content 마스킹할 콘텐츠
 * @returns 마스킹된 콘텐츠
 */
export function maskSensitiveData(content: string): string {
  let masked = content;
  
  for (const pattern of SENSITIVE_PATTERNS) {
    masked = masked.replace(pattern, '[MASKED]');
  }
  
  return masked;
}
