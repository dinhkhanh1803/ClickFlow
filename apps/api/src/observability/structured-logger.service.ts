import { Injectable, type LoggerService } from '@nestjs/common';

import { redactSensitive } from './redaction';

type LogLevel = 'debug' | 'error' | 'fatal' | 'info' | 'verbose' | 'warn';

@Injectable()
export class StructuredLoggerService implements LoggerService {
  log(message: unknown, context?: string): void {
    this.write('info', message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.write('error', message, context, trace);
  }

  warn(message: unknown, context?: string): void {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.write('verbose', message, context);
  }

  fatal(message: unknown, context?: string): void {
    this.write('fatal', message, context);
  }

  private write(level: LogLevel, message: unknown, context?: string, trace?: string): void {
    const entry = redactSensitive({
      timestamp: new Date().toISOString(),
      level,
      context,
      message: typeof message === 'string' ? message : undefined,
      data: typeof message === 'string' ? undefined : message,
      trace: process.env.NODE_ENV === 'production' ? undefined : trace
    });
    const line = `${JSON.stringify(entry)}\n`;
    if (level === 'error' || level === 'fatal') process.stderr.write(line);
    else process.stdout.write(line);
  }
}
