import generateAnimalName from 'random-animal-name';
import _ from 'lodash';

import { v4 as genUid } from 'uuid';
import { ValueError } from '@n1k1t/typebox/errors';

import { mergeMetaTags, serializeExpectationSchema } from '../utils';
import { ExpectationOperator } from './operator';
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
  > & {
    format: 'plain';
  };

  public TCompact!: Omit<Expectation<TInput, TContext>['TPlain'], 'schema' | 'format'> & {
    format: 'compact';
  };

  public id: string = this.configuration.id ?? genUid();
  public name: string = this.configuration.name ?? generateAnimalName().split(' ').map(_.capitalize).join('');
  public group: string = this.configuration.group ?? 'unknown';

  public transports?: TContext['transport'][] = this.configuration.transports;

  public schema = <IExpectationSchema<TContext>>this.configuration.schema;
  public isEnabled: boolean = this.configuration.isEnabled ?? true;

  public request: ExpectationOperator<any> = this.schema.request
    ? new operators.root(operators, this.schema.request)
    : new operators.root(operators, { $exec: () => true });

  public response: ExpectationOperator<any> | null = this.schema.response
    ? new operators.root(operators, this.schema.response)
    : null;

  public meta: IExpectationMeta = this.configuration.meta ?? {
    tags: mergeMetaTags([
      this.request.tags,
      this.response?.tags ?? {},

      {
        ...(this.schema.forward && {
          forward: {
            url: this.schema.forward.baseUrl ?? this.schema.forward.url,
          },
        }),
      },
    ]),

    metrics: {
      executions: 0,
    },
  };

  private serialized = {
    schema: {
      request: this.schema.request ? serializeExpectationSchema(this.schema.request) : undefined,
      response: this.schema.response ? serializeExpectationSchema(this.schema.response) : undefined,
    },
  };

  constructor(
    public configuration: Pick<Expectation<TInput, TContext>, 'schema'> & Partial<
      Pick<Expectation<TInput, TContext>, 'id' | 'name' | 'isEnabled' | 'group' | 'transports' | 'meta'>
    >
  ) {}

  public increaseExecutionsCounter(): this {
    this.meta.metrics.executions += 1;
    return this;
  }

  public validate(): ValueError[] {
    return [];
  }

  public toPlain(): Expectation<TInput, TContext>['TPlain'] {
    return {
      format: 'plain',

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

  public toCompact(): Expectation<TInput, TContext>['TCompact'] {
    return {
      format: 'compact',

      id: this.id,
      group: this.group,

      name: this.name,
      transports: this.transports,

      meta: this.meta,
      isEnabled: this.isEnabled,
    };
  }

  static build<TInput extends IExpectationSchemaInput = {}>(
    configuration: Expectation<TInput>['configuration']
  ): Expectation<TInput> {
    return new Expectation(configuration);
  }
}
