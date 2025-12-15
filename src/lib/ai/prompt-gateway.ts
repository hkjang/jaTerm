/**
 * Prompt Gateway
 * 프롬프트 검증, 템플릿 적용, 결과 마스킹 등 프롬프트 통제
 */

import { prisma } from '@/lib/db';
import { maskSensitiveData } from './crypto';
import { AIMessage, AIFeature } from './types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedPrompt?: string;
}

export interface TemplateVariables {
  [key: string]: string;
}

/**
 * Prompt Gateway - 프롬프트 통제 게이트웨이
 */
export class PromptGateway {
  private static instance: PromptGateway;

  private constructor() {}

  static getInstance(): PromptGateway {
    if (!PromptGateway.instance) {
      PromptGateway.instance = new PromptGateway();
    }
    return PromptGateway.instance;
  }

  /**
   * 프롬프트 검증
   */
  async validatePrompt(
    userId: string,
    prompt: string,
    feature: AIFeature,
    maxLength: number = 2000
  ): Promise<ValidationResult> {
    // 길이 검증
    if (prompt.length > maxLength) {
      return {
        valid: false,
        error: `프롬프트가 최대 길이(${maxLength}자)를 초과했습니다.`,
      };
    }

    // 빈 프롬프트 검증
    if (!prompt.trim()) {
      return {
        valid: false,
        error: '프롬프트가 비어있습니다.',
      };
    }

    // 금지 패턴 검사
    const forbiddenPatterns = [
      /ignore\s+previous\s+instructions/i,
      /disregard\s+all\s+(previous|prior)/i,
      /forget\s+(everything|all)/i,
      /you\s+are\s+now\s+/i,
      /act\s+as\s+if\s+you/i,
    ];

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(prompt)) {
        return {
          valid: false,
          error: '허용되지 않는 프롬프트 패턴이 감지되었습니다.',
        };
      }
    }

    // 민감 정보 자동 마스킹
    const sanitizedPrompt = maskSensitiveData(prompt);

    return {
      valid: true,
      sanitizedPrompt,
    };
  }

  /**
   * 템플릿 조회
   */
  async getTemplate(
    category: string,
    userRole: string
  ): Promise<{ template: string; variables: string[] } | null> {
    const template = await prisma.promptTemplate.findFirst({
      where: {
        category,
        isActive: true,
      },
    });

    if (!template) return null;

    // Role 권한 확인
    if (template.allowedRoles) {
      const allowedRoles = JSON.parse(template.allowedRoles) as string[];
      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return null;
      }
    }

    const variables = template.variables
      ? (JSON.parse(template.variables) as string[])
      : [];

    return {
      template: template.template,
      variables,
    };
  }

  /**
   * 템플릿에 변수 적용
   */
  applyTemplate(template: string, variables: TemplateVariables): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(pattern, value);
    }

    return result;
  }

  /**
   * 시스템 프롬프트 생성
   */
  getSystemPrompt(feature: AIFeature): string {
    const systemPrompts: Record<AIFeature, string> = {
      explain: `당신은 Linux/Unix 시스템 관리 전문가입니다. 
사용자가 제공하는 터미널 명령어를 분석하고 설명해주세요.
설명은 한국어로, 명확하고 간결하게 작성해주세요.
다음 내용을 포함해주세요:
1. 명령어의 기본 기능
2. 각 옵션과 인자의 의미
3. 실행 결과 예상
4. 잠재적 위험성 (있다면)`,

      generate: `당신은 Linux/Unix 시스템 관리 전문가입니다.
사용자의 요청을 분석하여 적절한 터미널 명령어를 생성해주세요.
다음 규칙을 따라주세요:
1. 안전하고 검증된 명령어만 생성
2. 위험한 작업은 경고 포함
3. 가능한 간단한 해결책 우선
4. 한국어로 설명 포함`,

      analyze: `당신은 보안 분석 전문가입니다.
제공된 명령어의 위험도를 분석해주세요.
다음 관점에서 분석해주세요:
1. 시스템 영향도
2. 데이터 손실 가능성
3. 보안 위험
4. 권장 사항`,

      summarize: `당신은 시스템 관리자입니다.
터미널 세션 로그를 요약해주세요.
다음 내용을 포함해주세요:
1. 수행된 주요 작업
2. 중요 명령어 목록
3. 의심스러운 활동 (있다면)
4. 권장 후속 조치`,
    };

    return systemPrompts[feature] || '';
  }

  /**
   * 완전한 메시지 배열 생성
   */
  async buildMessages(
    feature: AIFeature,
    userPrompt: string,
    context?: string
  ): Promise<AIMessage[]> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: this.getSystemPrompt(feature),
      },
    ];

    // 컨텍스트가 있으면 추가
    if (context) {
      messages.push({
        role: 'user',
        content: `[컨텍스트]\n${context}`,
      });
      messages.push({
        role: 'assistant',
        content: '네, 컨텍스트를 이해했습니다. 분석을 진행하겠습니다.',
      });
    }

    messages.push({
      role: 'user',
      content: userPrompt,
    });

    return messages;
  }

  /**
   * 결과 마스킹 적용
   */
  maskResult(content: string, enableMasking: boolean = false): string {
    if (!enableMasking) return content;
    return maskSensitiveData(content);
  }
}

// 싱글톤 인스턴스 export
export const promptGateway = PromptGateway.getInstance();
