import generateAnimalName from 'random-animal-name';
import { AxiosProxyConfig } from 'axios';
import { v4 as genUid } from 'uuid';
import { ValueError } from '@n1k1t/typebox/errors';
import _ from 'lodash';

import { IExpectationMeta, IExpectationOperatorContext, IExpectationSchema, TExpectationType } from '../types';
import { PartialDeep, TRequestProtocol } from '../../types';

import * as operators from '../operators';

export type TBuildExpectationConfiguration<TContext extends PartialDeep<IExpectationOperatorContext> = {}> =
  Pick<Expectation<TContext>, 'schema'> & Partial<Pick<Expectation<TContext>, 'name' | 'isEnabled' | 'type'>>;

export class Expectation<TContext extends PartialDeep<IExpectationOperatorContext> = {}> {
  public TSchema!: IExpectationSchema<TContext>;
  public TPlain!: Pick<Expectation<TContext>, 'schema' | 'type' | 'id' | 'isEnabled' | 'meta' | 'name'>;

  public id: string = genUid();
  public name: string = generateAnimalName().split(' ').map(_.capitalize).join('');

  public isEnabled: boolean = true;

  public request = this.schema.request
    ? new operators.root<TContext>(operators, this.schema.request)
    : null;

  public response = this.schema.response
    ? new operators.root<TContext>(operators, this.schema.response)
    : null;

  public meta: IExpectationMeta = {
    executionsCount: 0,
    tags: (this.request?.tags ?? []).concat(this.response?.tags ?? []),
  };

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
    return Object.assign(
      new Expectation(configuration.type ?? 'HTTP', configuration.schema),
      _.omit(configuration, ['schema', 'type'])
    );
  }
}
