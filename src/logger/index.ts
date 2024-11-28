import colors from 'colors';
import _ from 'lodash';

import { calculateLogLevelWeight, colorifyLogLevel, serializeLogSegments } from './utils';
import { TLoggerLevel, TLoggerSerializer } from './types';
import { TFunction } from '../types';

import config from '../config';

export * from './types';

export class Logger {
  constructor(public title: string) {}

  public debug(...messages: unknown[]): void {
    if (calculateLogLevelWeight(config.get('logger').level) <= calculateLogLevelWeight('D')) {
      return Logger.external?.debug
        ? Logger.external.debug(this.title, ...serializeLogSegments(messages, Logger.serializer))
        : this.publish('D', ...messages);
    }
  }

  public info(...messages: unknown[]): void {
    if (calculateLogLevelWeight(config.get('logger').level) <= calculateLogLevelWeight('I')) {
      return Logger.external?.info
        ? Logger.external.info(this.title, ...serializeLogSegments(messages, Logger.serializer))
        : this.publish('I', ...messages);
    }
  }

  public warn(...messages: unknown[]): void {
    if (calculateLogLevelWeight(config.get('logger').level) <= calculateLogLevelWeight('W')) {
      return Logger.external?.warn
        ? Logger.external.warn(this.title, ...serializeLogSegments(messages, Logger.serializer))
        : this.publish('W', ...messages);
    }
  }

  public error(...messages: unknown[]): void {
    if (calculateLogLevelWeight(config.get('logger').level) <= calculateLogLevelWeight('E')) {
      return Logger.external?.error
        ? Logger.external.error(this.title, ...serializeLogSegments(messages, Logger.serializer))
        : this.publish('E', ...messages);
    }
  }

  public fatal(...messages: unknown[]): void {
    if (calculateLogLevelWeight(config.get('logger').level) <= calculateLogLevelWeight('F')) {
      return Logger.external?.fatal
        ? Logger.external.fatal(this.title, ...serializeLogSegments(messages, Logger.serializer))
        : this.publish('F', ...messages);
    }
  }

  private publish(level: TLoggerLevel, ...messages: unknown[]): void {
    console.log(
      colors.gray(new Date().toLocaleTimeString()),
      colorifyLogLevel(level),
      _.get(colors, 'brightWhite')(this.title),
      ...serializeLogSegments(messages, Logger.serializer).map((segment) => colors.white(String(segment)))
    );
  }

  static serializer: TLoggerSerializer | null = null;
  static external: Partial<Pick<Logger, 'debug' | 'info' | 'warn' | 'error' | 'fatal'>> | null = null;

  static useExternal(external: NonNullable<typeof Logger['external']>) {
    return Object.assign(Logger, { external });
  }

  static useSerializers(serializers: Record<string, TFunction<unknown, [unknown]>>) {
    return Object.assign(Logger, {
      serializer: (key: string, value: unknown) => serializers[key] ?? value,
    });
  }

  static build(title: string) {
    return new Logger(title);
  }
}
