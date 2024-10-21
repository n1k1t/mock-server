import generateAnimalName from 'random-animal-name';
import { AxiosProxyConfig } from 'axios';
import { Type } from '@n1k1t/typebox';
import { v4 as genUid } from 'uuid';
import rfdc from 'rfdc';
import _ from 'lodash';

import { exploreNestedExpectationSchema, extractMetaAdditionalFromExpectationSchema } from './utils';
import { ExpectationTargetionalValidationSchema, ExpectationValidationSchema } from './validation-schemas';
import { UseValidation, validate } from '../utils';
import { TRequestProtocol } from '../types';
import {
  BuildExpectaionSchema,
  IExpectationDelay,
  IExpectationMeta,
  LExpectationDestroyType,
  LExpectationForwardProtocol,
  TExpectationContext,
  TExpectationContextLocation,
  TExpectationType,
} from './types';

const clone = rfdc();

export class Expectation {
  public id: string = genUid();
  public name: string = generateAnimalName().split(' ').map(_.capitalize).join('');

  public isEnabled: boolean = true;

  public meta: IExpectationMeta = {
    executionsCount: 0,
    additional: {},
  };

  @UseValidation(
    Type.Optional(
      Type.Object({
        ms: Type.Number(),
        times: Type.Optional(Type.Number()),
      })
    )
  )
  public delay?: IExpectationDelay | IExpectationDelay[];

  @UseValidation(
    Type.Optional(
      Type.Union(LExpectationDestroyType.map((value) => Type.Literal(value)))
    )
  )
  public destroy?: 'ECONNABORTED';

  @UseValidation(Type.Optional(ExpectationValidationSchema))
  public request?: BuildExpectaionSchema<{
    context: TExpectationContext<'request'>;

    validationLocation: 'path' | 'method' | 'headers' | 'body' | 'query';
    manipulationLocation: 'path' | 'method' | 'headers' | 'body' | 'query';
  }>;

  @UseValidation(Type.Optional(ExpectationValidationSchema))
  public response?: BuildExpectaionSchema<{
    context: TExpectationContext<'response'>;
    manipulationLocation: 'headers' | 'data' | 'statusCode';
  }>;

  @UseValidation(
    Type.Optional(
      Type.Object({
        protocol: Type.Union(LExpectationForwardProtocol.map((value) => Type.Literal(value))),
        host: Type.String(),
        port: Type.Number(),

        timeout: Type.Optional(Type.Number()),
        proxy: Type.Optional(
          Type.Object({
            protocol: Type.Union(LExpectationForwardProtocol.map((value) => Type.Literal(value))),
          }),
        )
      })
    )
  )
  public forward?: {
    protocol: TRequestProtocol;
    host: string;
    port: number;

    timeout?: number;
    proxy?: AxiosProxyConfig & {
      protocol: TRequestProtocol;
    }
  };

  constructor(public type: TExpectationType) {}

  public increaseExecutionsCounter(): this {
    this.meta.executionsCount += 1;
    return this;
  }

  public validateContext(location: TExpectationContextLocation, context: TExpectationContext): boolean {
    return exploreNestedExpectationSchema('validation', this[location] ?? {}, context);
  }

  public manipulateContext<K extends TExpectationContextLocation, T extends TExpectationContext<K>>(
    location: TExpectationContextLocation,
    context: T,
    options?: { clone?: boolean }
  ): T {
    const result = options?.clone ? clone(context) : context;

    exploreNestedExpectationSchema('manipulation', this[location] ?? {}, result);
    return result;
  }

  public validate() {
    return validate(this, [ExpectationValidationSchema, ExpectationTargetionalValidationSchema]);
  }

  static build<T extends Omit<Partial<Expectation>, 'id' | 'type' | 'meta'>>(
    type: TExpectationType = 'HTTP',
    configuration?: T
  ) {
    const expectation = Object.assign(new Expectation(type), configuration ?? {});

    expectation.meta.additional = Object.assign(
      extractMetaAdditionalFromExpectationSchema(expectation.request ?? {}),
      extractMetaAdditionalFromExpectationSchema(expectation.response ?? {}),
    );

    return expectation;
  }
}
