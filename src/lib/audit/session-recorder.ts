import { prisma } from '@/lib/db';
import crypto from 'crypto';

interface RecordingEvent {
  time: number; // Timestamp relative to session start
  type: 'i' | 'o'; // input or output
  data: string;
}

interface SessionRecordingData {
  version: number;
  width: number;
  height: number;
  timestamp: number;
  events: RecordingEvent[];
}

/**
 * Session Recorder - Records terminal I/O for replay
 */
export class SessionRecorder {
  private sessionId: string;
  private startTime: number;
  private events: RecordingEvent[] = [];
  private width: number;
  private height: number;
  private isRecording: boolean = false;

  constructor(sessionId: string, width: number = 80, height: number = 24) {
    this.sessionId = sessionId;
    this.startTime = Date.now();
    this.width = width;
    this.height = height;
  }

  /**
   * Start recording
   */
  start(): void {
    this.isRecording = true;
    this.startTime = Date.now();
    this.events = [];
  }

  /**
   * Record terminal input
   */
  recordInput(data: string): void {
    if (!this.isRecording) return;
    this.events.push({
      time: Date.now() - this.startTime,
      type: 'i',
      data,
    });
  }

  /**
   * Record terminal output
   */
  recordOutput(data: string): void {
    if (!this.isRecording) return;
    this.events.push({
      time: Date.now() - this.startTime,
      type: 'o',
      data,
    });
  }

  /**
   * Stop recording and save
   */
  async stop(): Promise<void> {
    if (!this.isRecording) return;
    this.isRecording = false;

    const duration = Math.floor((Date.now() - this.startTime) / 1000);
    const recordingData: SessionRecordingData = {
      version: 1,
      width: this.width,
      height: this.height,
      timestamp: this.startTime,
      events: this.events,
    };

    const dataBuffer = Buffer.from(JSON.stringify(recordingData));
    const checksum = crypto
      .createHash('sha256')
      .update(dataBuffer)
      .digest('hex');

    await prisma.sessionRecording.create({
      data: {
        sessionId: this.sessionId,
        data: dataBuffer,
        format: 'json',
        duration,
        checksum,
      },
    });
  }

  /**
   * Get recording events (for live streaming)
   */
  getEvents(): RecordingEvent[] {
    return [...this.events];
  }
}

/**
 * Get session recording for replay
 */
export async function getSessionRecording(sessionId: string): Promise<SessionRecordingData | null> {
  const recording = await prisma.sessionRecording.findUnique({
    where: { sessionId },
  });

  if (!recording) return null;

  // Verify integrity
  const checksum = crypto
    .createHash('sha256')
    .update(recording.data)
    .digest('hex');

  if (checksum !== recording.checksum) {
    throw new Error('Recording integrity check failed');
  }

  return JSON.parse(recording.data.toString());
}

/**
 * List session recordings
 */
export async function listRecordings(params: {
  userId?: string;
  serverId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  const sessionWhere: any = {};
  if (params.userId) sessionWhere.userId = params.userId;
  if (params.serverId) sessionWhere.serverId = params.serverId;
  if (params.startDate || params.endDate) {
    sessionWhere.startedAt = {};
    if (params.startDate) sessionWhere.startedAt.gte = params.startDate;
    if (params.endDate) sessionWhere.startedAt.lte = params.endDate;
  }

  const recordings = await prisma.sessionRecording.findMany({
    where: {
      session: sessionWhere,
    },
    include: {
      session: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          server: {
            select: { id: true, name: true, hostname: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: params.limit || 50,
    skip: params.offset || 0,
  });

  return recordings;
}

// Active recorders
const recorders = new Map<string, SessionRecorder>();

/**
 * Get or create recorder for session
 */
export function getRecorder(
  sessionId: string,
  width?: number,
  height?: number
): SessionRecorder {
  let recorder = recorders.get(sessionId);
  if (!recorder) {
    recorder = new SessionRecorder(sessionId, width, height);
    recorders.set(sessionId, recorder);
  }
  return recorder;
}

/**
 * Remove recorder
 */
export function removeRecorder(sessionId: string): void {
  recorders.delete(sessionId);
}
