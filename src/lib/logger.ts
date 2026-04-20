type LogLevel = 'info' | 'warn' | 'error'

interface LogMeta {
  requestId?: string
  route?: string
  [key: string]: unknown
}

function write(level: LogLevel, msg: string, meta?: LogMeta) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...meta,
  }
  const line = JSON.stringify(entry)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const logger = {
  info: (msg: string, meta?: LogMeta) => write('info', msg, meta),
  warn: (msg: string, meta?: LogMeta) => write('warn', msg, meta),
  error: (msg: string, meta?: LogMeta) => write('error', msg, meta),
}

export function newRequestId(): string {
  return crypto.randomUUID()
}
