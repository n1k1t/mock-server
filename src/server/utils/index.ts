import _ from 'lodash';

import { TObject, TSchema, Type } from '@n1k1t/typebox';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { Value, ValueError } from '@n1k1t/typebox/value';

import type { TRequestPayloadType } from '../types';
import type { Constructable } from '../../../types';

import { parseJsonSafe } from '../../utils';

export * from './rx';

interface IValidationMetaContext {
  schema: TObject;
  properties: Set<string | Symbol>;
}

const validationContextMetaKey = Symbol('validation:context');

const xmlBuilder = new XMLBuilder({ ignoreAttributes: false });
const xmlParser = new XMLParser({ ignoreAttributes: false });

const buildValidationMetaContext = (): IValidationMetaContext => ({
  schema: Type.Object({}),
  properties: new Set(),
});

export const extractValidationMetaContext =
  (Definition: Constructable<object> | Function): IValidationMetaContext | null =>
    Reflect.get(Definition, validationContextMetaKey) ?? null;

export const validate = (instance: object, references: TSchema[] = []): ValueError[] => {
  const context = extractValidationMetaContext(instance.constructor);
  return context ? [...Value.Errors(context.schema, references, instance)] : [];
}

export const UseValidation = (schema: TSchema): PropertyDecorator => (target, key) => {
  const context = extractValidationMetaContext(target.constructor)
    ?? buildValidationMetaContext();

  context.properties.add(key);
  context.schema = Type.Composite([context.schema, Type.Object({ [key]: schema })]);

  Reflect.set(target.constructor, validationContextMetaKey, context);
}

export const parsePayload = (raw: Buffer, expected?: TRequestPayloadType): {
  type: TRequestPayloadType;
  data: unknown;
} => {
  if (expected === 'xml') {
    return xmlParser.parse(raw) ?? undefined
  }

  const serialized = raw.toString();
  const parsed = parseJsonSafe(serialized);

  if (parsed.status === 'OK') {
    return {
      type: _.isObject(parsed.result) ? 'json' : 'plain',
      data: parsed.result,
    };
  }

  return {
    type: 'plain',
    data: serialized,
  };
}

export const serializePayload = (type: TRequestPayloadType, payload: unknown): Buffer => {
  switch(type) {
    case 'json': return Buffer.from(JSON.stringify(payload) ?? '');

    case 'plain': return Buffer.from(String(payload ?? ''));
    case 'xml': return Buffer.from(xmlBuilder.build(payload ?? {}) ?? '');
  }
}
