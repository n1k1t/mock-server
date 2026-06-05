import rfdc from 'rfdc';
import _ from 'lodash';

import { TRequestPayloadType } from '../types';
import { parseJsonSafe } from '../../utils';

export type TRequestMessageType = Extract<TRequestPayloadType, 'json' | 'plain'>;

const clone = rfdc();

export class RequestMessage<TPayload = any> {
  private initial = {
    dataRaw: this.dataRaw,
  };

  constructor(
    public type: TRequestMessageType,
    public dataRaw: Buffer,
    public data: TPayload
  ) {}

  public is(type: 'json'): this is RequestMessage<TPayload>;
  public is(type: 'plain'): this is RequestMessage<undefined>;

  public is(type: TRequestMessageType): boolean {
    return this.type === type;
  }

  public serialize(): Buffer {
    if (this.dataRaw !== this.initial.dataRaw) {
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

  /** Clones this instance (deep clones nested `json` data) */
  public clone(): RequestMessage<TPayload> {
    const data = _.isObject(this.data)
      ? clone(this.data)
      : this.data;

    return new RequestMessage(this.type, this.dataRaw, data);
  }

  static build<TPayload>(predicate: unknown): RequestMessage<TPayload> {
    const rawData = predicate instanceof Buffer ? predicate : null;
    const parsed = rawData
      ? parseJsonSafe<any>(rawData.toString('utf8'))
      : _.isObject(predicate)
        ? <const>{ status: 'OK', result: predicate }
        : parseJsonSafe(String(predicate))

    return new RequestMessage(
      parsed?.status === 'OK' ? 'json' : 'plain',
      rawData ?? Buffer.from(String(predicate)),
      parsed?.result ?? predicate
    );
  }
}
