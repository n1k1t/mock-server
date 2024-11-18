import generateAnimalName from 'random-animal-name';
import { AxiosProxyConfig } from 'axios';
import { v4 as genUid } from 'uuid';
import { ValueError } from '@n1k1t/typebox/errors';
import { Type } from '@n1k1t/typebox';
import _ from 'lodash';

import { TRequestProtocol } from '../../types';
import { UseValidation } from '../../utils';
import {
  IExpectationMeta,
  IExpectationOperatorContext,
  IExpectationSchema,
  LExpectationDestroyType,
  TExpectationType,
} from '../types';

import * as operators from '../operators';

export type TBuildExpectationConfiguration<TContext extends PartialDeep<IExpectationOperatorContext> = {}> =
  Pick<Expectation<TContext>, 'schema'> & Partial<Pick<Expectation<TContext>, 'name' | 'isEnabled' | 'type'>>;

export class Expectation<TContext extends PartialDeep<IExpectationOperatorContext> = {}> {
  public TSchema!: IExpectationSchema<TContext>;
  public TPlain!: Pick<Expectation<TContext>, 'schema' | 'type' | 'id' | 'isEnabled' | 'meta' | 'name'>;

  public id: string = genUid();
  public name: string = generateAnimalName().split(' ').map(_.capitalize).join('');

  public isEnabled: boolean = true;

  public meta: IExpectationMeta = {
    executionsCount: 0,
    additional: {},
  };

  public request = this.schema.request
    ? new operators.root<TContext>(operators, this.schema.request)
    : null;

  public response = this.schema.response
    ? new operators.root<TContext>(operators, this.schema.response)
    : null;

  @UseValidation(
    Type.Optional(
      Type.Object({
        ms: Type.Number(),
        times: Type.Optional(Type.Number()),
      })
    )
  )
  public get delay() {
    return this.schema.delay;
  };

  @UseValidation(
    Type.Optional(
      Type.Union(LExpectationDestroyType.map((value) => Type.Literal(value)))
    )
  )
  public get destroy() {
    return this.schema.destroy;
  }

  public get forward() {
    return this.schema.forward;
  }

  constructor(public type: TExpectationType, public schema: IExpectationSchema<TContext>) {}

  public increaseExecutionsCounter(): this {
    this.meta.executionsCount += 1;
    return this;
  }

  public validate(): ValueError[] {
    return [];
  }

  public toPlain(): Expectation<TContext>['TPlain'] {
    return {
      id: this.id,
      type: this.type,

      name: this.name,
      schema: this.schema,

      meta: this.meta,
      isEnabled: this.isEnabled,
    };
  }

  static build<TContext extends PartialDeep<IExpectationOperatorContext> = {}>(
    configuration: TBuildExpectationConfiguration<TContext>
  ) {
    // expectation.meta.additional = Object.assign(
    //   extractMetaAdditionalFromExpectationSchema(expectation.request ?? {}),
    //   extractMetaAdditionalFromExpectationSchema(expectation.response ?? {}),
    // );

    return Object.assign(
      new Expectation(configuration.type ?? 'HTTP', configuration.schema),
      _.omit(configuration, ['schema', 'type'])
    );
  }
}
