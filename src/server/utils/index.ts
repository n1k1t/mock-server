import { TObject, TSchema, Type } from '@n1k1t/typebox';
import { Value, ValueError } from '@n1k1t/typebox/value';

import type { Constructable } from '../../../types';

interface IValidationMetaContext {
  schema: TObject;
  properties: Set<string | Symbol>;
}

const validationContextMetaKey = Symbol('validation:context');

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
