import colors from 'colors';
import _ from 'lodash';

import { TLoggerLevel, TLoggerSerializer } from './types';

export const serializeLogSegments = (
  segments: unknown[],
  serializer: TLoggerSerializer | null = null
): unknown[] => segments.map((segment) => (_.isObject(segment) ? JSON.stringify(segment, serializer ?? undefined) : segment));

export const colorifyLogLevel = _.memoize((level: TLoggerLevel): string => ({
  D: colors.gray('[D]'),
  I: colors.cyan('[I]'),
  W: colors.yellow('[W]'),
  E: colors.red('[E]'),
  F: colors.magenta('[F]'),
})[level]);

export const calculateLogLevelWeight = _.memoize((level: TLoggerLevel): number => ({
  D: 10,
  I: 20,
  W: 30,
  E: 40,
  F: 50,
})[level]);
