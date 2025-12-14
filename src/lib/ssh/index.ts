export { 
  createSSHConnection, 
  openShell, 
  resizeTerminal, 
  closeSSHConnection,
  getConnection,
  getActiveConnections,
  isConnectionActive
} from './ssh-proxy';

export type { SSHConnection, SSHConnectionConfig } from './ssh-proxy';

export {
  CommandFilter,
  getCommandFilterForPolicy,
  extractCommand,
} from './command-filter';

export type { CommandCheckResult, CommandMode } from './command-filter';
