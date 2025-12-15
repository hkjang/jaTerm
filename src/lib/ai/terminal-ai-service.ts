/**
 * Terminal AI Service
 * 터미널에서 사용하는 AI 기능 통합 서비스
 */

import { aiProviderManager } from './ai-provider-manager';
import { promptGateway } from './prompt-gateway';
import { aiPolicyEngine } from './ai-policy-engine';
import { aiAuditLogger } from './ai-audit-logger';
import { commandAnalyzer, RiskAnalysis } from './command-analyzer';
import {
  AIFeature,
  CommandExplanation,
  CommandGeneration,
  SessionSummary,
  RiskAnalysisResult,
} from './types';

interface AIServiceOptions {
  userId: string;
  userRole: string;
  ipAddress?: string;
}

/**
 * Terminal AI Service - 터미널 AI 기능 통합
 */
export class TerminalAIService {
  private static instance: TerminalAIService;

  private constructor() {}

  static getInstance(): TerminalAIService {
    if (!TerminalAIService.instance) {
      TerminalAIService.instance = new TerminalAIService();
    }
    return TerminalAIService.instance;
  }

  /**
   * 명령어 설명
   */
  async explainCommand(
    command: string,
    options: AIServiceOptions
  ): Promise<{
    success: boolean;
    explanation?: CommandExplanation;
    error?: string;
  }> {
    const feature: AIFeature = 'explain';
    const startTime = Date.now();

    try {
      // 정책 확인
      const policyCheck = await aiPolicyEngine.checkPermission(
        options.userId,
        options.userRole,
        feature
      );

      if (!policyCheck.allowed) {
        await aiAuditLogger.logBlocked(
          options.userId,
          feature,
          command,
          policyCheck.reason || 'Policy denied',
          options.ipAddress
        );
        return { success: false, error: policyCheck.reason };
      }

      // 프롬프트 검증
      const maxLength = await aiPolicyEngine.getPromptMaxLength();
      const validation = await promptGateway.validatePrompt(
        options.userId,
        command,
        feature,
        maxLength
      );

      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // 메시지 구성
      const messages = await promptGateway.buildMessages(
        feature,
        `다음 명령어를 분석하고 설명해주세요:\n\n\`${command}\``
      );

      // AI 호출
      const provider = await aiProviderManager.getDefaultProvider();
      if (!provider) {
        return { success: false, error: 'AI Provider가 설정되지 않았습니다.' };
      }

      const response = await aiProviderManager.complete({
        model: 'default',
        messages,
        maxTokens: 1000,
        temperature: 0.3,
      });

      const durationMs = Date.now() - startTime;

      // Rate Limit 증가
      await aiPolicyEngine.incrementRateLimit(options.userId);

      // 로그 기록
      await aiAuditLogger.logSuccess(options.userId, feature, command, {
        providerName: provider.getName(),
        modelName: response.model,
        responseTokens: response.usage.completionTokens,
        durationMs,
        ipAddress: options.ipAddress,
      });

      // 결과 파싱
      const explanation: CommandExplanation = {
        command,
        summary: response.content.split('\n')[0] || response.content,
        details: response.content,
        components: [],
        risks: [],
      };

      return { success: true, explanation };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await aiAuditLogger.logFailure(
        options.userId,
        feature,
        command,
        errorMessage,
        { ipAddress: options.ipAddress }
      );

      return { success: false, error: errorMessage };
    }
  }

  /**
   * 명령어 생성
   */
  async generateCommand(
    description: string,
    options: AIServiceOptions
  ): Promise<{
    success: boolean;
    generation?: CommandGeneration;
    error?: string;
  }> {
    const feature: AIFeature = 'generate';
    const startTime = Date.now();

    try {
      // 정책 확인
      const policyCheck = await aiPolicyEngine.checkPermission(
        options.userId,
        options.userRole,
        feature
      );

      if (!policyCheck.allowed) {
        await aiAuditLogger.logBlocked(
          options.userId,
          feature,
          description,
          policyCheck.reason || 'Policy denied',
          options.ipAddress
        );
        return { success: false, error: policyCheck.reason };
      }

      // 프롬프트 검증
      const maxLength = await aiPolicyEngine.getPromptMaxLength();
      const validation = await promptGateway.validatePrompt(
        options.userId,
        description,
        feature,
        maxLength
      );

      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // 메시지 구성
      const messages = await promptGateway.buildMessages(
        feature,
        `다음 요청에 맞는 터미널 명령어를 생성해주세요:\n\n${description}\n\n응답 형식:\n명령어: [생성된 명령어]\n설명: [명령어 설명]`
      );

      // AI 호출
      const provider = await aiProviderManager.getDefaultProvider();
      if (!provider) {
        return { success: false, error: 'AI Provider가 설정되지 않았습니다.' };
      }

      const response = await aiProviderManager.complete({
        model: 'default',
        messages,
        maxTokens: 500,
        temperature: 0.5,
      });

      const durationMs = Date.now() - startTime;

      // Rate Limit 증가
      await aiPolicyEngine.incrementRateLimit(options.userId);

      // 로그 기록
      await aiAuditLogger.logSuccess(options.userId, feature, description, {
        providerName: provider.getName(),
        modelName: response.model,
        responseTokens: response.usage.completionTokens,
        durationMs,
        ipAddress: options.ipAddress,
      });

      // 결과 파싱 (간단한 파싱)
      const content = response.content;
      const commandMatch = content.match(/명령어[:\s]+(.+?)(?:\n|$)/);
      const generatedCommand = commandMatch?.[1]?.trim() || content.split('\n')[0];

      const generation: CommandGeneration = {
        description,
        command: generatedCommand,
        explanation: content,
        confidence: 0.8,
      };

      return { success: true, generation };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await aiAuditLogger.logFailure(
        options.userId,
        feature,
        description,
        errorMessage,
        { ipAddress: options.ipAddress }
      );

      return { success: false, error: errorMessage };
    }
  }

  /**
   * 명령어 위험 분석 (기존 CommandAnalyzer 연동 + AI 강화)
   */
  async analyzeRisk(
    command: string,
    options: AIServiceOptions
  ): Promise<{
    success: boolean;
    analysis?: RiskAnalysisResult;
    error?: string;
  }> {
    const feature: AIFeature = 'analyze';

    try {
      // 기본 분석 (로컬 패턴 기반)
      const basicAnalysis: RiskAnalysis = commandAnalyzer.analyze(command);

      // AI 강화가 필요한 경우 (위험 수준이 높을 때)
      if (basicAnalysis.riskScore >= 0.5) {
        const policyCheck = await aiPolicyEngine.checkPermission(
          options.userId,
          options.userRole,
          feature
        );

        if (policyCheck.allowed) {
          // AI로 상세 분석
          const messages = await promptGateway.buildMessages(
            feature,
            `다음 명령어의 위험도를 0-100% 스케일로 분석해주세요:\n\n\`${command}\`\n\n위험 요소, 잠재적 영향, 권장 사항을 포함해주세요.`
          );

          try {
            const response = await aiProviderManager.complete({
              model: 'default',
              messages,
              maxTokens: 500,
              temperature: 0.2,
            });

            // AI 분석 결과 병합
            return {
              success: true,
              analysis: {
                riskScore: basicAnalysis.riskScore,
                riskLevel: this.getRiskLevel(basicAnalysis.riskScore),
                categories: basicAnalysis.categories,
                explanation: response.content,
                recommendation: basicAnalysis.recommendation,
              },
            };
          } catch {
            // AI 실패시 기본 분석만 반환
          }
        }
      }

      // 기본 분석 결과 반환
      return {
        success: true,
        analysis: {
          riskScore: basicAnalysis.riskScore,
          riskLevel: this.getRiskLevel(basicAnalysis.riskScore),
          categories: basicAnalysis.categories,
          explanation: basicAnalysis.explanation,
          recommendation: basicAnalysis.recommendation,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 세션 요약
   */
  async summarizeSession(
    sessionId: string,
    commands: string[],
    options: AIServiceOptions
  ): Promise<{
    success: boolean;
    summary?: SessionSummary;
    error?: string;
  }> {
    const feature: AIFeature = 'summarize';
    const startTime = Date.now();

    try {
      // 정책 확인
      const policyCheck = await aiPolicyEngine.checkPermission(
        options.userId,
        options.userRole,
        feature
      );

      if (!policyCheck.allowed) {
        return { success: false, error: policyCheck.reason };
      }

      // 명령어 목록 생성
      const commandList = commands.join('\n');
      const prompt = `다음 터미널 세션의 명령어 이력을 요약해주세요:\n\n${commandList}\n\n주요 작업, 중요 명령어, 권장 사항을 포함해주세요.`;

      // 메시지 구성
      const messages = await promptGateway.buildMessages(feature, prompt);

      // AI 호출
      const provider = await aiProviderManager.getDefaultProvider();
      if (!provider) {
        return { success: false, error: 'AI Provider가 설정되지 않았습니다.' };
      }

      const response = await aiProviderManager.complete({
        model: 'default',
        messages,
        maxTokens: 1000,
        temperature: 0.3,
      });

      const durationMs = Date.now() - startTime;

      // 로그 기록
      await aiAuditLogger.logSuccess(options.userId, feature, prompt, {
        providerName: provider.getName(),
        modelName: response.model,
        responseTokens: response.usage.completionTokens,
        durationMs,
        ipAddress: options.ipAddress,
      });

      // 위험 명령어 분석
      const riskyCommands = commands
        .map((cmd) => ({
          command: cmd,
          riskScore: commandAnalyzer.analyze(cmd).riskScore,
        }))
        .filter((c) => c.riskScore >= 0.5)
        .sort((a, b) => b.riskScore - a.riskScore);

      const summary: SessionSummary = {
        sessionId,
        duration: durationMs,
        commandCount: commands.length,
        summary: response.content,
        highlights: [],
        riskyCommands,
      };

      return { success: true, summary };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 위험 레벨 변환
   */
  private getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 0.9) return 'CRITICAL';
    if (score >= 0.7) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    return 'LOW';
  }
}

// 싱글톤 인스턴스 export
export const terminalAIService = TerminalAIService.getInstance();
