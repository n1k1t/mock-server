import merge from 'deepmerge';
import rfdc from 'rfdc';
import _ from 'lodash';

import { PartialDeep, TFunction } from '../../../../types';
import { compileContainerKey } from './utils';

const clone = rfdc();

export class Container<TPayload extends object = object> {
  public TPlain!: Pick<Container<TPayload>, 'key' | 'payload' | 'ttl'>;
  public TBackup!: Pick<Container<TPayload>, 'key' | 'group' | 'payload' | 'ttl' | 'timestamp'> & {
    aliases: string[];
  };

  public key: string = this.provided.key;
  public group: string = this.provided.group;

  public aliases: Set<string> = this.provided.aliases instanceof Set
    ? this.provided.aliases
    : new Set(this.provided.aliases ?? []);

  /** Seconds */
  public ttl: number = this.provided.ttl;
  public payload: TPayload = this.provided.payload;
  public timestamp: number = this.provided.timestamp;

  protected hooks?: {
    bind?: TFunction<unknown, [string, Container<any>]>;
    unbind?: TFunction<unknown, [string, Container<any>]>;
  } = this.provided.hooks;

  constructor(protected provided: Pick<Container<TPayload>, 'key' | 'group' | 'payload' | 'ttl' | 'timestamp'> & {
    aliases?: Container<TPayload>['aliases'] | string[];
    hooks?: Container<TPayload>['hooks'];
  }) {}

  /** Updates internal timestamp to increase TTL */
  public renew(): this {
    this.timestamp = Date.now();
    return this;
  }

  /** Checks expiration by TTL */
  public checkIsExpired(timestamp: number = Date.now()): boolean {
    return (this.provided.timestamp + this.ttl * 1000) < timestamp;
  }

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

  /** Binds this container to another alias key */
  public bind(key: string | object): this {
    const compiled = compileContainerKey(key);

    this.aliases.add(compiled);
    this.hooks?.bind?.(compiled, this);

    return this;
  }

  /** Unbinds this container by provided key */
  public unbind(key?: string | object): this {
    const compiled = key ? compileContainerKey(key) : this.key;

    this.aliases.delete(compiled);
    this.hooks?.unbind?.(compiled, this);

    return this;
  }

  /** Setups hooks to work with storage */
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
    return {
      key: this.key,
      ttl: this.ttl,

      payload: this.payload,
    };
  }

  public toBackup(): Container<TPayload>['TBackup'] {
    return {
      group: this.group,
      key: this.key,
      ttl: this.ttl,

      timestamp: this.timestamp,
      payload: this.payload,

      aliases: [...this.aliases.values()],
    };
  }

  static build<T extends object>(provided: Container<T>['provided']) {
    return new Container<T>(provided);
  }
}
