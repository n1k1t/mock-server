import _ from 'lodash';
import { TLoggerLevel, TLoggerSerializer } from './types';

export const serializeLogSegments = (
  segments: unknown[],
  serializer: TLoggerSerializer | null = null
): unknown[] => segments.map((segment) => (_.isObject(segment) ? JSON.stringify(segment, serializer ?? undefined) : segment));

export const colorifyLogLevel = _.memoize((level: TLoggerLevel): string => ({
  D: '[D]'.gray,
  I: '[I]'.cyan,
  W: '[W]'.yellow,
  E: '[E]'.red,
  F: '[F]'.magenta,
})[level]);

export const calculateLogLevelWeight = _.memoize((level: TLoggerLevel): number => ({
  D: 10,
  I: 20,
  W: 30,
  E: 40,
  F: 50,
})[level]);
