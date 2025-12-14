import { Client, ClientChannel } from 'ssh2';
import { prisma } from '@/lib/db';

export interface SSHConnectionConfig {
  host: string;
  port: number;
  username: string;
  privateKey?: string;
  password?: string;
}

export interface SSHConnection {
  client: Client;
  shell?: ClientChannel;
  sessionId: string;
}

// Active connections pool
const connections = new Map<string, SSHConnection>();

/**
 * Create a new SSH connection
 */
export async function createSSHConnection(
  sessionId: string,
  config: SSHConnectionConfig
): Promise<SSHConnection> {
  return new Promise((resolve, reject) => {
    const client = new Client();

    const connectionConfig: any = {
      host: config.host,
      port: config.port,
      username: config.username,
      readyTimeout: parseInt(process.env.SSH_TIMEOUT || '30000'),
    };

    if (config.privateKey) {
      connectionConfig.privateKey = config.privateKey;
    } else if (config.password) {
      connectionConfig.password = config.password;
    }

    client.on('ready', () => {
      const connection: SSHConnection = {
        client,
        sessionId,
      };
      connections.set(sessionId, connection);
      resolve(connection);
    });

    client.on('error', (err) => {
      console.error(`SSH connection error for session ${sessionId}:`, err);
      reject(err);
    });

    client.on('close', () => {
      connections.delete(sessionId);
    });

    client.connect(connectionConfig);
  });
}

/**
 * Open an interactive shell
 */
export async function openShell(
  sessionId: string,
  options: { cols: number; rows: number }
): Promise<ClientChannel> {
  const connection = connections.get(sessionId);
  if (!connection) {
    throw new Error('SSH connection not found');
  }

  return new Promise((resolve, reject) => {
    connection.client.shell(
      {
        term: 'xterm-256color',
        cols: options.cols,
        rows: options.rows,
      },
      (err, stream) => {
        if (err) {
          reject(err);
          return;
        }
        connection.shell = stream;
        resolve(stream);
      }
    );
  });
}

/**
 * Resize terminal
 */
export function resizeTerminal(
  sessionId: string,
  cols: number,
  rows: number
): void {
  const connection = connections.get(sessionId);
  if (connection?.shell) {
    connection.shell.setWindow(rows, cols, 0, 0);
  }
}

/**
 * Close SSH connection
 */
export async function closeSSHConnection(sessionId: string): Promise<void> {
  const connection = connections.get(sessionId);
  if (connection) {
    connection.shell?.close();
    connection.client.end();
    connections.delete(sessionId);
  }
}

/**
 * Get connection by session ID
 */
export function getConnection(sessionId: string): SSHConnection | undefined {
  return connections.get(sessionId);
}

/**
 * Get all active connections
 */
export function getActiveConnections(): Map<string, SSHConnection> {
  return connections;
}

/**
 * Check if connection is active
 */
export function isConnectionActive(sessionId: string): boolean {
  return connections.has(sessionId);
}
