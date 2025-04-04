import rfdc from 'rfdc';
import _ from 'lodash';

import { serializeRegExp } from '../../utils';
import {
  IExpectationSchema,
  LExpectationFlatOperator,
  TExpectationFlatOperator,
  IExpectationOperatorsSchema,
} from '../types';

const clone = rfdc();

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

export const serializeExpectationSchema = <T extends IExpectationOperatorsSchema<any>>(schema: T): T => {
  const cloned = clone(schema ?? {});

  introspectExpectationOperatorsSchema(schema, (key, schema, path) => {
    if (key === '$exec') {
      _.set(cloned, path, schema.$exec?.toString());
    }

    if (key === '$has' && schema.$has?.$regExp) {
      _.set(cloned, `${path}.$regExp`, serializeRegExp(schema.$has.$regExp));
    }
    if (key === '$has' && schema.$has?.$regExpAnyOf) {
      _.set(cloned, `${path}.$regExpAnyOf`, schema.$has.$regExpAnyOf.map((expr) => serializeRegExp(expr)));
    }

    if (key === '$has' && schema.$has?.$exec) {
      _.set(cloned, `${path}.$exec`, schema.$has.$exec.toString());
    }
    if (key === '$set' && schema.$set?.$exec) {
      _.set(cloned, `${path}.$exec`, schema.$set.$exec.toString());
    }
    if (key === '$merge' && schema.$merge?.$exec) {
      _.set(cloned, `${path}.$exec`, schema.$merge.$exec.toString());
    }
    if (key === '$switch' && schema.$switch?.$exec) {
      _.set(cloned, `${path}.$exec`, schema.$switch.$exec.toString());
    }
  });

  return cloned;
}
