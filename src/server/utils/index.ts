import _ from 'lodash';

import { XMLBuilder, XMLParser } from 'fast-xml-parser';

import { TRequestPayloadType } from '../types';
import { parseJsonSafe } from '../../utils';

export * from './validation';
export * from './rx';

const xmlBuilder = new XMLBuilder({ ignoreAttributes: false });
const xmlParser = new XMLParser({ ignoreAttributes: false });

/** Parses any payload into `type` and `data` */
export const parsePayload = (payload: unknown, expected?: TRequestPayloadType): {
  type: TRequestPayloadType;
  data: unknown;
} => {
  if (payload instanceof Buffer || typeof payload === 'string') {
    if (expected === 'xml') {
      return {
        type: 'xml',
        data: xmlParser.parse(payload) ?? undefined,
      };
    }

    const serialized = payload.toString();
    const parsed = parseJsonSafe(serialized);

    if (parsed.status === 'OK') {
      return {
        type: _.isObject(parsed.result) ? 'json' : 'plain',
        data: parsed.result,
      };
    }

    return {
      type: 'plain',
      data: serialized,
    };
  }

  if (_.isObject(payload)) {
    return {
      type: 'json',
      data: payload,
    };
  }

  return {
    type: 'plain',
    data: payload,
  };
}

/** Serializes any payload into `Buffer` by provided `type` */
export const serializePayload = (type: TRequestPayloadType, payload: unknown): Buffer => {
  switch(type) {
    case 'json': return Buffer.from(JSON.stringify(payload) ?? '');

    case 'plain': return Buffer.from(String(payload ?? ''));
    case 'xml': return Buffer.from(xmlBuilder.build(payload ?? {}) ?? '');
  }
}
