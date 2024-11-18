import _ from 'lodash';

import {
  IExpectationSchema,
  IExpectationMeta,
  LExpectationAttachlessOperator,
  TExpectationAttachlessOperator,
  IExpectationOperatorContext,
  IExpectationOperatorsSchema,
  TExpectationOperatorLocation,
  IExpectationOperatorExecUtils,
} from './types';

type TBaseExtractedContext = { parent: object, key: string };
type TExtractedContext =
  | (TBaseExtractedContext & { value: object, type: 'object' })
  | (TBaseExtractedContext & { value: string, type: 'string' })
  | (TBaseExtractedContext & { value: number, type: 'number' });

export const extractContextByLocation = (
  location: TExpectationOperatorLocation,
  context: PartialDeep<IExpectationOperatorContext>
): TExtractedContext | null => {
  if (!_.has(context, location) && location !== 'method' && location !== 'path') {
    return null;
  }

  switch(location) {
    case 'path': return {
      key: 'path',
      type: 'string',
      parent: context.incoming!,
      value: context.incoming!.path!,
    };

    case 'method': return {
      key: 'method',
      type: 'string',
      parent: context.incoming!,
      value: context.incoming!.method!,
    };

    case 'incoming.body': return {
      key: 'body',
      type: 'object',
      parent: context.incoming!,
      value: context.incoming!.body!,
    };

    case 'incoming.bodyRaw': return {
      key: 'bodyRaw',
      type: 'string',
      parent: context.incoming!,
      value: context.incoming!.bodyRaw!,
    };

    case 'incoming.query': return {
      key: 'query',
      type: 'object',
      parent: context.incoming!,
      value: context.incoming!.query!,
    };

    case 'incoming.headers': return {
      key: 'headers',
      type: 'object',
      parent: context.incoming!,
      value: context.incoming!.headers!,
    };

    case 'outgoing.data': return {
      key: 'data',
      type: 'object',
      parent: context.outgoing!,
      value: context.outgoing!.data!,
    };

    case 'outgoing.dataRaw': return {
      key: 'dataRaw',
      type: 'string',
      parent: context.outgoing!,
      value: context.outgoing!.dataRaw!,
    };

    case 'outgoing.headers': return {
      key: 'headers',
      type: 'object',
      parent: context.outgoing!,
      value: context.outgoing!.headers!,
    };

    case 'outgoing.status': return {
      key: 'status',
      type: 'number',
      parent: context.outgoing!,
      value: context.outgoing!.status!,
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
      acc.responseStatuses = (acc.responseStatuses ?? []).concat([<number>segment[key]?.$value].filter(Boolean));
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
          acc.requestMethods = (acc.requestMethods ?? []).concat(_.flatten([valuePredicate]).map(String));
          break;
        };
        case 'path': {
          acc.requestPaths = (acc.requestPaths ?? []).concat(_.flatten([valuePredicate]).map(String));
          break;
        }
      }
    }
  });

  return acc;
}
