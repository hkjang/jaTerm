// Automation - Macros, Variables, Scheduling

import { Macro, MacroStep, MacroVariable, MacroCondition, ScheduledTask, BroadcastCommand, BroadcastResult } from './types';

// ============================================
// Macro Execution Engine
// ============================================

export interface MacroExecutionContext {
  variables: Record<string, string>;
  serverId: string;
  serverName: string;
  userId: string;
  onCommandExecute: (command: string) => Promise<{ output: string; exitCode: number }>;
  onProgress: (step: number, total: number, status: string) => void;
  onLog: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export interface MacroExecutionResult {
  success: boolean;
  stepsCompleted: number;
  totalSteps: number;
  outputs: { step: number; command: string; output: string; exitCode: number }[];
  error?: string;
  duration: number;
}

export async function executeMacro(
  macro: Macro,
  context: MacroExecutionContext
): Promise<MacroExecutionResult> {
  const startTime = Date.now();
  const outputs: MacroExecutionResult['outputs'] = [];
  let currentStep = 0;

  try {
    for (const step of macro.steps) {
      currentStep++;
      context.onProgress(currentStep, macro.steps.length, `Step ${currentStep}: ${step.type}`);

      const result = await executeStep(step, context, outputs);
      
      if (result.type === 'command') {
        outputs.push({
          step: currentStep,
          command: result.command!,
          output: result.output!,
          exitCode: result.exitCode!,
        });
      }

      // Check condition for branching
      if (result.nextStep) {
        const nextStepIndex = macro.steps.findIndex(s => s.id === result.nextStep);
        if (nextStepIndex >= 0) {
          currentStep = nextStepIndex;
        }
      }
    }

    return {
      success: true,
      stepsCompleted: currentStep,
      totalSteps: macro.steps.length,
      outputs,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      stepsCompleted: currentStep,
      totalSteps: macro.steps.length,
      outputs,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

interface StepResult {
  type: 'command' | 'wait' | 'condition' | 'prompt';
  command?: string;
  output?: string;
  exitCode?: number;
  nextStep?: string;
}

async function executeStep(
  step: MacroStep,
  context: MacroExecutionContext,
  previousOutputs: MacroExecutionResult['outputs']
): Promise<StepResult> {
  switch (step.type) {
    case 'command': {
      const command = substituteVariables(step.command!, context.variables);
      context.onLog(`Executing: ${command}`, 'info');
      
      const result = await context.onCommandExecute(command);
      context.onLog(`Exit code: ${result.exitCode}`, result.exitCode === 0 ? 'success' : 'warning');

      // Check condition for branching
      let nextStep: string | undefined;
      if (step.condition) {
        const conditionMet = evaluateCondition(step.condition, result);
        nextStep = conditionMet ? step.onSuccess : step.onFailure;
      }

      return {
        type: 'command',
        command,
        output: result.output,
        exitCode: result.exitCode,
        nextStep,
      };
    }

    case 'wait': {
      context.onLog(`Waiting ${step.waitTime}ms...`, 'info');
      await new Promise(resolve => setTimeout(resolve, step.waitTime || 1000));
      return { type: 'wait' };
    }

    case 'condition': {
      if (!step.condition) {
        return { type: 'condition' };
      }

      const lastOutput = previousOutputs[previousOutputs.length - 1];
      if (!lastOutput) {
        return { type: 'condition' };
      }

      const conditionMet = evaluateCondition(step.condition, {
        output: lastOutput.output,
        exitCode: lastOutput.exitCode,
      });

      return {
        type: 'condition',
        nextStep: conditionMet ? step.onSuccess : step.onFailure,
      };
    }

    case 'prompt': {
      // In a real implementation, this would prompt the user
      context.onLog(`Prompt: ${step.prompt}`, 'info');
      return { type: 'prompt' };
    }

    default:
      return { type: 'command' };
  }
}

// ============================================
// Variable Substitution
// ============================================

export function substituteVariables(
  command: string,
  variables: Record<string, string>
): string {
  let result = command;

  // Replace ${VAR_NAME} patterns
  for (const [name, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\$\\{${name}\\}`, 'g'), value);
    result = result.replace(new RegExp(`\\$${name}\\b`, 'g'), value);
  }

  // Built-in variables
  const now = new Date();
  result = result.replace(/\$\{DATE\}/g, now.toISOString().split('T')[0]);
  result = result.replace(/\$\{TIME\}/g, now.toTimeString().split(' ')[0]);
  result = result.replace(/\$\{TIMESTAMP\}/g, now.toISOString());
  result = result.replace(/\$\{UNIX_TIMESTAMP\}/g, Math.floor(now.getTime() / 1000).toString());

  return result;
}

export function extractVariables(command: string): string[] {
  const patterns = [/\$\{(\w+)\}/g, /\$(\w+)\b/g];
  const variables = new Set<string>();

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(command)) !== null) {
      // Skip built-in variables
      const builtins = ['DATE', 'TIME', 'TIMESTAMP', 'UNIX_TIMESTAMP'];
      if (!builtins.includes(match[1])) {
        variables.add(match[1]);
      }
    }
  }

  return Array.from(variables);
}

// ============================================
// Condition Evaluation
// ============================================

function evaluateCondition(
  condition: MacroCondition,
  result: { output: string; exitCode: number }
): boolean {
  switch (condition.type) {
    case 'output_contains':
      return result.output.includes(condition.pattern || '');

    case 'output_matches':
      try {
        const regex = new RegExp(condition.pattern || '');
        return regex.test(result.output);
      } catch {
        return false;
      }

    case 'exit_code':
      return result.exitCode === Number(condition.value);

    case 'always':
      return true;

    default:
      return true;
  }
}

// ============================================
// Broadcast Command Execution
// ============================================

export interface BroadcastExecutionContext {
  userId: string;
  executeOnServer: (
    serverId: string,
    command: string
  ) => Promise<{ output: string; exitCode: number; duration: number }>;
  onServerProgress: (serverId: string, status: 'running' | 'completed' | 'failed') => void;
  onComplete: (results: BroadcastResult[]) => void;
  timeout?: number;
}

export async function executeBroadcast(
  command: string,
  serverIds: string[],
  serverNames: Record<string, string>,
  excludedServers: string[],
  context: BroadcastExecutionContext
): Promise<BroadcastCommand> {
  const broadcastId = `bc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const targetServers = serverIds.filter(id => !excludedServers.includes(id));
  
  const broadcast: BroadcastCommand = {
    id: broadcastId,
    command,
    targetServers,
    excludedServers,
    status: 'running',
    results: [],
    createdAt: new Date(),
  };

  const timeout = context.timeout || 30000;

  // Execute in parallel with timeout
  const promises = targetServers.map(async (serverId) => {
    context.onServerProgress(serverId, 'running');

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), timeout);
      });

      const result = await Promise.race([
        context.executeOnServer(serverId, command),
        timeoutPromise,
      ]);

      const broadcastResult: BroadcastResult = {
        serverId,
        serverName: serverNames[serverId] || serverId,
        status: result.exitCode === 0 ? 'success' : 'failed',
        output: result.output,
        duration: result.duration,
      };

      context.onServerProgress(serverId, 'completed');
      return broadcastResult;
    } catch (error) {
      const isTimeout = error instanceof Error && error.message === 'Timeout';
      
      const broadcastResult: BroadcastResult = {
        serverId,
        serverName: serverNames[serverId] || serverId,
        status: isTimeout ? 'timeout' : 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: timeout,
      };

      context.onServerProgress(serverId, 'failed');
      return broadcastResult;
    }
  });

  const results = await Promise.all(promises);
  
  broadcast.results = results;
  broadcast.status = results.every(r => r.status === 'success') ? 'completed' : 'failed';
  broadcast.completedAt = new Date();

  context.onComplete(results);
  return broadcast;
}

// ============================================
// Result Aggregation
// ============================================

export interface AggregatedResults {
  total: number;
  success: number;
  failed: number;
  timeout: number;
  skipped: number;
  avgDuration: number;
  successRate: number;
  byServer: Record<string, BroadcastResult>;
  commonErrors: { error: string; count: number }[];
}

export function aggregateBroadcastResults(results: BroadcastResult[]): AggregatedResults {
  const success = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const timeout = results.filter(r => r.status === 'timeout').length;
  const skipped = results.filter(r => r.status === 'skipped').length;

  const durations = results.map(r => r.duration).filter(d => d > 0);
  const avgDuration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;

  // Count common errors
  const errorCounts: Record<string, number> = {};
  for (const result of results) {
    if (result.error) {
      errorCounts[result.error] = (errorCounts[result.error] || 0) + 1;
    }
  }

  const commonErrors = Object.entries(errorCounts)
    .map(([error, count]) => ({ error, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // By server map
  const byServer: Record<string, BroadcastResult> = {};
  for (const result of results) {
    byServer[result.serverId] = result;
  }

  return {
    total: results.length,
    success,
    failed,
    timeout,
    skipped,
    avgDuration,
    successRate: results.length > 0 ? (success / results.length) * 100 : 0,
    byServer,
    commonErrors,
  };
}

// ============================================
// Cron Schedule Parser (simplified)
// ============================================

export function parseSchedule(cron: string): { next: Date; description: string } | null {
  const parts = cron.split(' ');
  if (parts.length !== 5) return null;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  // Simple descriptions
  let description = '';
  
  if (minute === '*' && hour === '*') {
    description = '매 분마다';
  } else if (minute === '0' && hour === '*') {
    description = '매 시간마다';
  } else if (minute === '0' && hour !== '*' && dayOfWeek === '*') {
    description = `매일 ${hour}시에`;
  } else if (dayOfWeek !== '*') {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    description = `매주 ${days[parseInt(dayOfWeek)]}요일 ${hour}시 ${minute}분에`;
  } else {
    description = `${hour}시 ${minute}분에`;
  }

  // Calculate next execution (simplified)
  const now = new Date();
  const next = new Date(now);
  
  if (minute !== '*') {
    next.setMinutes(parseInt(minute));
  }
  if (hour !== '*') {
    next.setHours(parseInt(hour));
  }
  
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return { next, description };
}

// ============================================
// Preset Macros
// ============================================

export const PRESET_MACROS: Omit<Macro, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '서버 상태 확인',
    description: '시스템 리소스 및 서비스 상태를 확인합니다',
    steps: [
      { id: 's1', type: 'command', command: 'uptime' },
      { id: 's2', type: 'command', command: 'free -h' },
      { id: 's3', type: 'command', command: 'df -h' },
      { id: 's4', type: 'command', command: 'systemctl status nginx || echo "nginx not installed"' },
    ],
    variables: [],
    conditions: [],
    isShared: true,
  },
  {
    name: '로그 정리',
    description: '오래된 로그 파일을 정리합니다',
    steps: [
      { id: 's1', type: 'command', command: 'find /var/log -name "*.gz" -mtime +${DAYS} -type f' },
      { id: 's2', type: 'prompt', prompt: '위 파일들을 삭제하시겠습니까?' },
      { id: 's3', type: 'command', command: 'find /var/log -name "*.gz" -mtime +${DAYS} -type f -delete' },
    ],
    variables: [
      { name: 'DAYS', type: 'number', defaultValue: '30', required: true, description: '보관 일수' },
    ],
    conditions: [],
    isShared: true,
  },
  {
    name: '애플리케이션 배포',
    description: '애플리케이션을 배포합니다',
    steps: [
      { id: 's1', type: 'command', command: 'cd ${APP_PATH}' },
      { id: 's2', type: 'command', command: 'git pull origin ${BRANCH}' },
      { id: 's3', type: 'command', command: 'npm install' },
      { id: 's4', type: 'command', command: 'npm run build' },
      { id: 's5', type: 'command', command: 'pm2 restart ${APP_NAME}' },
    ],
    variables: [
      { name: 'APP_PATH', type: 'string', required: true, description: '애플리케이션 경로' },
      { name: 'BRANCH', type: 'select', defaultValue: 'main', options: ['main', 'develop', 'staging'], required: true, description: '배포 브랜치' },
      { name: 'APP_NAME', type: 'string', required: true, description: 'PM2 앱 이름' },
    ],
    conditions: [],
    isShared: true,
  },
  {
    name: 'Docker 컨테이너 재시작',
    description: 'Docker 컨테이너를 재시작합니다',
    steps: [
      { id: 's1', type: 'command', command: 'docker ps -a | grep ${CONTAINER}' },
      { id: 's2', type: 'command', command: 'docker restart ${CONTAINER}' },
      { id: 's3', type: 'wait', waitTime: 5000 },
      { id: 's4', type: 'command', command: 'docker logs --tail 20 ${CONTAINER}' },
    ],
    variables: [
      { name: 'CONTAINER', type: 'string', required: true, description: '컨테이너 이름 또는 ID' },
    ],
    conditions: [],
    isShared: true,
  },
];
