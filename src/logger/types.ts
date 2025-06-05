import { TFunction } from '../../types';

export type TLoggerLevel = 'D' | 'I' | 'W' | 'E' | 'F';
export type TLoggerSerializer = TFunction<unknown, [string, unknown]>;
