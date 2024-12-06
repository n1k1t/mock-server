import merge from 'deepmerge';
import _ from 'lodash';

import { PartialDeep, TFunction } from '../../../types';
import { compileContainerLink } from './utils';

export class Container<TPayload extends object = object> {
  public TPlain!: Pick<Container<TPayload>, 'link' | 'prefix' | 'payload' | 'expiresAt'>;

  public expiresAt = this.configuration.timestamp + this.configuration.ttl * 1000;
  public prefix = this.configuration.prefix ?? '';
  public link = this.prefix + this.key;

  constructor(
    public key: string,
    public payload: TPayload,
    public configuration: {
      /**
       * Seconds
       */
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
    this.configuration.hooks?.onBind?.(compileContainerLink(key), this);
    return this;
  }

  public unbind(): this {
    this.configuration.hooks?.onUnbind?.(this);
    return this;
  }

  public toPlain(): Container<TPayload>['TPlain'] {
    return _.pick(this, ['link', 'prefix', 'payload', 'expiresAt']);
  }

  static build<T extends object>(key: string, payload: T, options: Container['configuration']) {
    return new Container(key, payload, options);
  }
}
