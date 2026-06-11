import rfdc from 'rfdc';
import _ from 'lodash';

import { TRequestPayloadType } from '../types';
import { parsePayload } from '../utils';

export type TRequestMessageDirection = 'incoming' | 'outgoing';
export type TRequestMessageType = Extract<TRequestPayloadType, 'json' | 'plain'>;

const clone = rfdc();

export class RequestMessage<TPayload = any> {
  public TPlain!: Pick<RequestMessage<TPayload>, 'type' | 'direction' | 'timestamp' | 'data'>;
  public TCache!: Pick<RequestMessage<TPayload>, 'type' | 'direction' | 'timestamp' | 'data'> & {
    raw: {
      data?: string;
    };
  };

  public direction: TRequestMessageDirection = this.provided.direction;
  public type: TRequestMessageType = this.provided.type;

  public timestamp: number = this.provided.timestamp ?? Date.now();

  public data: TPayload = this.provided.data;
  public raw: { data?: Buffer } = this.provided.raw;

  constructor(protected provided: Pick<RequestMessage<TPayload>, 'direction' | 'type' | 'data' | 'raw'> & {
    timestamp?: number;
  }) {}

  public is(type: 'json'): this is RequestMessage<Extract<TPayload, object>>;
  public is(type: 'plain'): this is RequestMessage<Exclude<TPayload, object>>;

  public is(type: TRequestMessageType): boolean {
    return this.type === type;
  }

  public serialize(): Buffer {
    if (this.data instanceof Buffer) {
      return this.data;
    }
    if (_.isObject(this.data)) {
      return Buffer.from(JSON.stringify(this.data));
    }
    if (this.data !== undefined) {
      return Buffer.from(String(this.data));
    }

    return this.raw.data ?? Buffer.from('');
  }

  /** Returns bytes length of data */
  public size(): number {
    return this.direction === 'incoming'
      ? this.raw.data?.length ?? this.serialize().length
      : this.serialize().length;
  }

  /** Clones this instance */
  public clone(options?: {
    /** Deep clones nested `json` data */
    deep?: boolean;
  }): RequestMessage<TPayload> {
    return new RequestMessage({
      direction: this.direction,
      type: this.type,

      timestamp: this.timestamp,

      data: (options?.deep && _.isObject(this.data)) ? clone(this.data) : this.data,
      raw: this.raw,
    });
  }

  public redirect(direction: TRequestMessageDirection): this {
    this.direction = direction;
    return this;
  }

  public toPlain(): RequestMessage<TPayload>['TPlain'] {
    return {
      direction: this.direction,
      type: this.type,

      timestamp: this.timestamp,
      data: this.data,
    };
  }

  public toCache(): RequestMessage<TPayload>['TCache'] {
    return {
      direction: this.direction,
      type: this.type,

      timestamp: this.timestamp,
      data: this.data,

      raw: {
        data: this.raw.data?.toString('base64'),
      },
    };
  }

  static build<TPayload>(plain: RequestMessage<TPayload>['TPlain']): RequestMessage<TPayload>;
  static build<TPayload>(direction: TRequestMessageDirection, predicate: unknown): RequestMessage<TPayload>;

  static build<TPayload>(
    directionOrPlain: TRequestMessageDirection | RequestMessage<TPayload>['TPlain'],
    predicate?: unknown
  ): RequestMessage<TPayload> {
    if (_.isObject(directionOrPlain)) {
      return new RequestMessage(
        Object.assign(directionOrPlain, { raw: {} })
      );
    }

    const parsed = parsePayload(predicate);

    return new RequestMessage({
      direction: directionOrPlain,

      type: <TRequestMessageType>(parsed?.type ?? 'plain'),
      data: <TPayload>(parsed?.data ?? undefined),

      raw: {
        data: predicate instanceof Buffer ? predicate : undefined,
      },
    });
  }
}
