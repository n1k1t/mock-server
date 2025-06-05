import merge from 'deepmerge';
import rfdc from 'rfdc';
import _ from 'lodash';

import { PartialDeep, TFunction } from '../../../../types';
import { compileContainerLink } from './utils';

const clone = rfdc();

export class Container<TPayload extends object = object> {
  public TPlain!: Pick<Container<TPayload>, 'key' | 'prefix' | 'payload' | 'ttl'>;

  public ttl = this.provided.ttl;
  public expiresAt = this.provided.timestamp + this.ttl * 1000;

  public payload = this.provided.payload;

  public prefix = this.provided.prefix;
  public key = (this.prefix ?? '') + this.provided.key;

  constructor(
    public provided: {
      key: string;
      payload: TPayload;

      /** Seconds */
      ttl: number;
      timestamp: number;

      prefix?: string;

      hooks?: {
        onBind?: TFunction<unknown, [string, Container<any>]>;
        onUnbind?: TFunction<unknown, [Container<any>]>;
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

  public bind(key: string | object): this {
    this.provided.hooks?.onBind?.(compileContainerLink(key), this);
    return this;
  }

  public unbind(): this {
    this.provided.hooks?.onUnbind?.(this);
    return this;
  }

  public clone(): Container<TPayload> {
    return new Container<TPayload>({ ...this.provided, payload: clone(this.payload) });
  }

  public toPlain(): Container<TPayload>['TPlain'] {
    return _.pick(this, ['key', 'prefix', 'payload', 'ttl']);
  }

  static build<T extends object>(provided: Container<T>['provided']) {
    return new Container<T>(provided);
  }
}
