import _ from 'lodash';

import {
  IExpectationSchema,
  TExpectationOperatorHandler,
  TExpectationOperatorHandlerParameters,
  TExpectationOperator,
  IExpectationMeta,
  LExpectationAttachlessOperator,
  TExpectationAttachlessOperator,
  IExpectationTargetionalSchema,
} from './types';

import * as operators from './operators';

type TExpectationSchemaEntry = { [K in TExpectationOperator]: [K, NonNullable<IExpectationSchema[K]>] }[TExpectationOperator];

export const exploreNestedExpectationSchema: TFunction<boolean, TExpectationOperatorHandlerParameters> =
  (mode, schema, context) => {
    switch(mode) {
      case 'validation': {
        if (Object.keys(schema).length === 0) {
          return true;
        }

        return (<TExpectationSchemaEntry[]>Object.entries(schema)).some(
          ([operator, configuration]) =>
            (<TExpectationOperatorHandler>operators[operator])(mode, configuration, context, {
              exploreNestedSchema: exploreNestedExpectationSchema,
            })
        );
      }

      case 'manipulation': {
        (<TExpectationSchemaEntry[]>Object.entries(schema)).forEach(
          ([operator, configuration]) =>
            (<TExpectationOperatorHandler>operators[operator])(mode, configuration, context, {
              exploreNestedSchema: exploreNestedExpectationSchema,
            })
        );

        return true;
      }
    }
  }

export const introspectExpectationSchema = <
  T extends object = IExpectationSchema & NonNullable<IExpectationSchema['$if']>,
  K extends keyof T = keyof T
>(schema: T, handler: (key: K, schema: T) => unknown): void => {
  (<K[]>Object.keys(schema)).forEach((key) => {
    handler(key, schema);

    if (_.isObject(schema[key]) && !LExpectationAttachlessOperator.includes(<TExpectationAttachlessOperator>key)) {
      introspectExpectationSchema(<T>schema[key], handler);
    }
  });
}

export const extractMetaAdditionalFromExpectationSchema = (schema: IExpectationSchema) => {
  const acc: IExpectationMeta['additional'] = {};

  introspectExpectationSchema(schema, (key, segment) => {
    if (key === '$set' && segment[key]?.$location === 'statusCode') {
      acc.responseStatuses = (acc.responseStatuses ?? []).concat([<number>segment[key]?.$value].filter(Boolean));
    }

    if (key === '$has' && ['method', 'path'].includes(segment[key]?.$location ?? '')) {
      const valuePredicate = segment[key]?.$value
        ?? segment[key]?.$valueAnyOf
        ?? segment[key]?.$minimatch
        ?? segment[key]?.$minimatchAnyOf
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
