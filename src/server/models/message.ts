import rfdc from 'rfdc';
import _ from 'lodash';

import { TRequestPayloadType } from '../types';
import { parsePayload } from '../utils';

export type TRequestMessageDirection = 'incoming' | 'outgoing';
export type TRequestMessageType = Extract<TRequestPayloadType, 'json' | 'plain'>;

const clone = rfdc();

export class RequestMessage<TPayload = any> {
  public TPlain!: Pick<RequestMessage<TPayload>, 'type' | 'direction' | 'timestamp' | 'data'> & {
    dataRaw: string;
  };

  public direction: TRequestMessageDirection = this.provided.direction;
  public type: TRequestMessageType = this.provided.type;

  public timestamp: number = this.provided.timestamp ?? Date.now();

  public data: TPayload = this.provided.data;
  public dataRaw: Buffer = this.provided.dataRaw;

  constructor(protected provided: Pick<RequestMessage<TPayload>, 'direction' | 'type' | 'data' | 'dataRaw'> & {
    timestamp?: number;
  }) {}

  public is(type: 'json'): this is RequestMessage<Extract<TPayload, object>>;
  public is(type: 'plain'): this is RequestMessage<Exclude<TPayload, object>>;

  public is(type: TRequestMessageType): boolean {
    return this.type === type;
  }

  public serialize(): Buffer {
    if (this.dataRaw !== this.provided.dataRaw) {
      return this.dataRaw;
    }
    if (_.isObject(this.data)) {
      return Buffer.from(JSON.stringify(this.data));
    }
    if (this.data !== undefined) {
      return Buffer.from(String(this.data));
    }

    return this.dataRaw;
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
      dataRaw: this.dataRaw,
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
      dataRaw: this.dataRaw.toString(),
    };
  }

  static build<TPayload>(plain: RequestMessage<TPayload>['TPlain']): RequestMessage<TPayload>;
  static build<TPayload>(direction: TRequestMessageDirection, predicate: unknown): RequestMessage<TPayload>;

  static build<TPayload>(
    directionOrPlain: TRequestMessageDirection | RequestMessage<TPayload>['TPlain'],
    predicate?: unknown
  ): RequestMessage<TPayload> {
    if (_.isObject(directionOrPlain)) {
      return new RequestMessage(Object.assign(directionOrPlain, {
        dataRaw: Buffer.from(directionOrPlain.dataRaw),
      }));
    }

    const raw = predicate instanceof Buffer
      ? predicate
      : Buffer.from(_.isObject(predicate) ? JSON.stringify(predicate) : String(predicate));

    const parsed = parsePayload(raw);

    return new RequestMessage({
      type: <TRequestMessageType>(parsed?.type ?? 'plain'),
      data: <TPayload>(parsed?.data ?? undefined),

      direction: directionOrPlain,
      dataRaw: raw,
    });
  }
}
