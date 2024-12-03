import { parse as parseQueryString } from 'querystring';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { parse as parseUrl } from 'url';
import { IncomingMessage } from 'http';
import _ from 'lodash';

import { IRequestContextIncoming } from './types';
import { TRequestPayloadType } from '../../../types';
import { parseJsonSafe } from '../../../utils';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
});

const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
});

const parseQuerySearch = (queryString: string): Record<string, unknown> =>
  Object.entries(parseQueryString(queryString)).reduce((acc, [key, value]) => {
    const valueAsJson = _.flatten([value]).map(arrValue => {
      const parsingArrayValueAsJsonResult = parseJsonSafe(arrValue ?? '');
      return parsingArrayValueAsJsonResult.status === 'OK' ? parsingArrayValueAsJsonResult.result : arrValue;
    });

    return _.set(acc, key, valueAsJson?.length === 1 ? valueAsJson[0] : valueAsJson);
  }, {});


export const extractPayloadType = (headers: IncomingMessage['headers']): TRequestPayloadType => {
  const contentTypeKey = Object.keys(headers).find((key) => key.toLowerCase() === 'content-type');
  const contextType = _.flatten([_.get(headers, contentTypeKey ?? '', '')]).join(',').toLowerCase();

  if (contextType.includes('application/json')) {
    return 'json'
  }
  if (contextType.includes('/xml')) {
    return 'xml'
  }

  return 'plain';
}

export const parsePayload = (type: TRequestPayloadType, raw: string): object | undefined => {
  if (type === 'json') {
    const parsed = parseJsonSafe(raw);
    return parsed.status === 'OK' ? parsed.result : undefined;
  }
  if (type === 'xml') {
    return xmlParser.parse(raw) ?? undefined;
  }

  return undefined;
}

export const serializePayload = (type: TRequestPayloadType, payload: object | null): string => {
  if (type === 'json') {
    return JSON.stringify(payload);
  }
  if (type === 'xml') {
    return xmlBuilder.build(payload ?? {});
  }

  return '';
}

export const extractHttpIncommingParameters = (
  request: IncomingMessage & { parsed: { raw: string, type?: TRequestPayloadType, payload?: object } }
): IRequestContextIncoming => {
  const { pathname, query: rawQuery } = parseUrl(request.url ?? '');

  const type = request.parsed.type ?? extractPayloadType(request.headers);
  const query = parseQuerySearch(rawQuery ?? '');

  return {
    type,

    method: String(request.method ?? 'GET').toUpperCase(),
    path: pathname ?? '/',

    query,

    bodyRaw: request.parsed.raw,
    body: 'payload' in request.parsed ? request.parsed.payload : parsePayload(type, request.parsed.raw),

    headers: Object
      .entries(request.headers)
      .map(([name, values]) => [
        name.toLowerCase(),
        _.flatten([values]).map((value) => String(value)).sort().join(',')
      ])
      .reduce((acc, [name, value]) => _.set(acc, name, value), {}),
  }
}
