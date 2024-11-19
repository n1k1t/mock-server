import _ from 'lodash';

import {
  IExpectationSchema,
  IExpectationMeta,
  LExpectationAttachlessOperator,
  TExpectationAttachlessOperator,
  IExpectationOperatorContext,
  IExpectationOperatorsSchema,
  TExpectationOperatorLocation,
} from './types';

type TBaseExtractedContext = { parent: object, key: string };
type TExtractedContext =
  | (TBaseExtractedContext & { value?: unknown, type: 'object' })
  | (TBaseExtractedContext & { value?: string, type: 'string' })
  | (TBaseExtractedContext & { value?: number, type: 'number' });

export const checkIsLocationInContext = (
  location: TExpectationOperatorLocation,
  context: PartialDeep<IExpectationOperatorContext>
): boolean => {
  switch(location) {
    case 'delay':
    case 'error':
    case 'method':
    case 'path': return _.has(context.incoming, location);

    default: return _.has(context, location);
  }
}

export const extractContextByLocation = (
  location: TExpectationOperatorLocation,
  context: PartialDeep<IExpectationOperatorContext>
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

    case 'incoming.body': return {
      key: 'incoming.body',
      type: 'object',
      parent: context,
      value: context.incoming?.body,
    };

    case 'incoming.bodyRaw': return {
      key: 'incoming.bodyRaw',
      type: 'string',
      parent: context,
      value: context.incoming?.bodyRaw,
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

    if (_.isObject(schema[key]) && !LExpectationAttachlessOperator.includes(<TExpectationAttachlessOperator>key)) {
      introspectExpectationOperatorsSchema(<T>schema[key], handler, path);
    }
  });
}

export const extractMetaAdditionalFromExpectationSchema = (schema: IExpectationOperatorsSchema) => {
  const acc: IExpectationMeta['additional'] = {};

  introspectExpectationOperatorsSchema(schema, (key, segment) => {
    if (key === '$set' && segment[key]?.$location === 'outgoing.status') {
      acc.statuses = (acc.statuses ?? []).concat([<number>segment[key]?.$value].filter(Boolean));
    }

    if (key === '$has' && ['method', 'path'].includes(segment[key]?.$location ?? '')) {
      const valuePredicate = segment[key]?.$value
        ?? segment[key]?.$valueAnyOf
        ?? segment[key]?.$match
        ?? segment[key]?.$matchAnyOf
        ?? segment[key]?.$regExp
        ?? segment[key]?.$regExpAnyOf
        ?? [];

      switch(segment[key]?.$location) {
        case 'method': {
          acc.methods = (acc.methods ?? []).concat(_.flatten([valuePredicate]).map(String));
          break;
        };
        case 'path': {
          acc.paths = (acc.paths ?? []).concat(_.flatten([valuePredicate]).map(String));
          break;
        }
      }
    }
  });

  return acc;
}
