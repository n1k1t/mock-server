import generateAnimalName from 'random-animal-name';
import { v4 as genUid } from 'uuid';
import { ValueError } from '@n1k1t/typebox/errors';
import _ from 'lodash';

import { serializeExpectationSchema } from '../utils';
import {
  IExpectationMeta,
  IExpectationSchemaContext,
  IExpectationSchemaInput,
  IExpectationSchema,
} from '../types';

import * as operators from '../operators';

export class Expectation<
  TInput extends IExpectationSchemaInput = {},
  TContext extends IExpectationSchemaContext<TInput> = IExpectationSchemaContext<TInput>
> {
  public TPlain!: Pick<
    Expectation<TInput, TContext>,
    'schema' | 'id' | 'group' | 'isEnabled' | 'meta' | 'name' | 'transports'
  >;

  public id: string = this.configuration.id ?? genUid();
  public name: string = this.configuration.name ?? generateAnimalName().split(' ').map(_.capitalize).join('');
  public group: string = this.configuration.group ?? 'unknown';

  public transports?: TContext['transport'][] = this.configuration.transports;

  public schema = <IExpectationSchema<TContext>>this.configuration.schema;
  public isEnabled: boolean = this.configuration.isEnabled ?? true;

  public request = this.schema.request
    ? new operators.root<TContext>(operators, this.schema.request)
    : new operators.root<TContext>(operators, { $exec: () => true });

  public response = this.schema.response
    ? new operators.root<TContext>(operators, this.schema.response)
    : null;

  public meta: IExpectationMeta = {
    executionsCount: this.configuration.meta?.executionsCount ?? 0,
    tags: (this.request?.tags ?? []).concat(this.response?.tags ?? []),
  };

  public get forward() {
    return this.schema.forward;
  }

  private serialized = {
    schema: {
      request: this.schema.request ? serializeExpectationSchema(this.schema.request) : undefined,
      response: this.schema.response ? serializeExpectationSchema(this.schema.response) : undefined,
    },
  };

  constructor(
    public configuration: Pick<Expectation<TContext>, 'schema'> & Partial<
      Pick<Expectation<TContext>, 'id' | 'name' | 'isEnabled' | 'group' | 'transports' | 'meta'>
    >
  ) {}

  public increaseExecutionsCounter(): this {
    this.meta.executionsCount += 1;
    return this;
  }

  public validate(): ValueError[] {
    return [];
  }

  public toPlain(): Expectation<TInput, TContext>['TPlain'] {
    return {
      id: this.id,
      group: this.group,

      name: this.name,
      transports: this.transports,

      meta: this.meta,
      isEnabled: this.isEnabled,

      schema: {
        ...this.schema,

        request: this.serialized.schema.request,
        response: this.serialized.schema.response,
      },
    };
  }

  static build<TContext extends IExpectationSchemaContext>(configuration: Expectation<TContext>['configuration']) {
    return new Expectation(configuration);
  }
}
