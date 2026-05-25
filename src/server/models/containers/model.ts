import merge from 'deepmerge';
import rfdc from 'rfdc';
import _ from 'lodash';

import { PartialDeep, TFunction } from '../../../../types';
import { compileContainerKey } from './utils';

const clone = rfdc();

export class Container<TPayload extends object = object> {
  public TPlain!: Pick<Container<TPayload>, 'key' | 'payload' | 'ttl'>;

  public key = this.provided.key;
  public group = this.provided.group;

  public ttl = this.provided.ttl;
  public timestamp = this.provided.timestamp;

  public expiresAt = this.provided.timestamp + this.ttl * 1000;
  public payload = this.provided.payload;

  private hooks = this.provided.hooks;

  constructor(
    private provided: {
      key: string;
      group: string;

      payload: TPayload;

      /** Seconds */
      ttl: number;
      timestamp: number;

      hooks?: {
        bind?: TFunction<unknown, [string, Container<any>]>;
        unbind?: TFunction<unknown, [Container<any>]>;
      };
    }
  ) {}

  public assign(predicate: Partial<TPayload> | TFunction<Partial<TPayload>, [TPayload]>) {
    const payload = Object.assign(
      this.payload,
      typeof predicate === 'function' ? predicate(this.payload) : predicate
    );

    return Object.assign(this, { payload });
  }

  public merge(predicate: PartialDeep<TPayload> | TFunction<PartialDeep<TPayload>, [TPayload]>) {
    const payload = merge(
      this.payload,
      <TPayload>(typeof predicate === 'function' ? predicate(this.payload) : predicate),
      { arrayMerge: (target, source) => source }
    );

    return Object.assign(this, { payload });
  }

  /** Binds this container to another key */
  public bind(key: string | object): this {
    this.hooks?.bind?.(compileContainerKey(key), this);
    return this;
  }

  /** Unbinds this container from nested key */
  public unbind(): this {
    this.hooks?.unbind?.(this);
    return this;
  }

  /** Returns initial configuration */
  public configure(payload: Partial<Pick<Container<TPayload>['provided'], 'hooks'>>): this {
    if (payload.hooks) {
      this.hooks = payload.hooks;
    }

    return this;
  }

  public clone(): Container<TPayload> {
    return new Container<TPayload>({ ...this.provided, payload: clone(this.payload) });
  }

  public toPlain(): Container<TPayload>['TPlain'] {
    return _.pick(this, ['key', 'payload', 'ttl']);
  }

  static build<T extends object>(provided: Container<T>['provided']) {
    return new Container<T>(provided);
  }
}
