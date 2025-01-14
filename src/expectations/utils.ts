import _ from 'lodash';

import {
  IExpectationSchema,
  LExpectationFlatOperator,
  TExpectationFlatOperator,
  IExpectationSchemaContext,
  TExpectationOperatorLocation,
} from './types';

type TBaseExtractedContext = { parent: object, key: string };
type TExtractedContext =
  | (TBaseExtractedContext & { value?: unknown, type: 'object' })
  | (TBaseExtractedContext & { value?: string, type: 'string' })
  | (TBaseExtractedContext & { value?: number, type: 'number' });

export const checkIsLocationInContext = (
  location: TExpectationOperatorLocation,
  context: IExpectationSchemaContext
): boolean => {
  switch(location) {
    case 'delay':
    case 'error':
    case 'method':
    case 'path': return context.incoming[location] !== undefined;

    default: return _.get(context, location) !== undefined;
  }
}

export const extractContextByLocation = (
  location: TExpectationOperatorLocation,
  context: IExpectationSchemaContext
): TExtractedContext | null => {
  switch(location) {
    case 'path': return {
      key: 'incoming.path',
      type: 'string',
      parent: context,
      value: context.incoming?.path,
    };

    case 'method': return {
      key: 'incoming.method',
      type: 'string',
      parent: context,
      value: context.incoming?.method,
    };

    case 'incoming.data': return {
      key: 'incoming.data',
      type: 'object',
      parent: context,
      value: context.incoming?.data,
    };

    case 'incoming.dataRaw': return {
      key: 'incoming.dataRaw',
      type: 'string',
      parent: context,
      value: context.incoming?.dataRaw,
    };

    case 'incoming.query': return {
      key: 'incoming.query',
      type: 'object',
      parent: context,
      value: context.incoming?.query,
    };

    case 'incoming.headers': return {
      key: 'incoming.headers',
      type: 'object',
      parent: context,
      value: context.incoming?.headers,
    };

    case 'incoming.stream': return {
      key: 'incoming.stream',
      type: 'object',
      parent: context,
      value: context.incoming.stream,
    };

    case 'outgoing.data': return {
      key: 'outgoing.data',
      type: 'object',
      parent: context,
      value: context.outgoing?.data,
    };

    case 'outgoing.dataRaw': return {
      key: 'outgoing.dataRaw',
      type: 'string',
      parent: context,
      value: context.outgoing?.dataRaw,
    };

    case 'outgoing.headers': return {
      key: 'outgoing.headers',
      type: 'object',
      parent: context,
      value: context.outgoing?.headers,
    };

    case 'outgoing.status': return {
      key: 'outgoing.status',
      type: 'number',
      parent: context,
      value: context.outgoing?.status,
    };

    case 'outgoing.stream': return {
      key: 'outgoing.stream',
      type: 'object',
      parent: context,
      value: context.outgoing.stream,
    };

    case 'delay': return {
      key: 'incoming.delay',
      type: 'number',
      parent: context,
      value: context.incoming?.delay,
    };

    case 'error': return {
      key: 'incoming.error',
      type: 'string',
      parent: context,
      value: context.incoming?.error,
    };

    case 'seed': return {
      key: 'seed',
      type: 'number',
      parent: context,
      value: context.seed,
    };

    case 'state': return {
      key: 'state',
      type: 'object',
      parent: context,
      value: context.state,
    };

    case 'cache': return {
      key: 'cache',
      type: 'object',
      parent: context,
      value: context.cache,
    };

    case 'container': return {
      key: 'container',
      type: 'object',
      parent: context,
      value: context.container,
    };

    case 'transport': return {
      key: 'transport',
      type: 'string',
      parent: context,
      value: <string>context.transport,
    };

    case 'event': return {
      key: 'event',
      type: 'string',
      parent: context,
      value: <string>context.event,
    };

    case 'flags': return {
      key: 'flags',
      type: 'object',
      parent: context,
      value: context.flags,
    };

    default: return null;
  }
}

export const introspectExpectationOperatorsSchema = <T extends object = IExpectationSchema, K extends keyof T = keyof T>(
  schema: T,
  handler: (key: K, schema: T, path: string) => unknown,
  location: string = ''
): void => {
  (<K[]>Object.keys(schema)).forEach((key) => {
    const path = location ? `${location}.${String(key)}` : String(key);

    handler(key, schema, path);

    if (_.isObject(schema[key]) && !LExpectationFlatOperator.includes(<TExpectationFlatOperator>key)) {
      introspectExpectationOperatorsSchema(<T>schema[key], handler, path);
    }
  });
}
