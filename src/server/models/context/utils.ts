import bodyParser from 'body-parser';
import _ from 'lodash';

import { IncomingMessage, ServerResponse } from 'http';
import { parse as parseQueryString } from 'querystring';
import { parse as parseUrl } from 'url';

import { formatHeaders, parseJsonSafe } from '../../../utils';
import { IRequestContextIncoming } from './types';
import { TRequestPayloadType } from '../../types';
import { parsePayload } from '../../utils';

const parseQuerySearch = (queryString: string): Record<string, unknown> =>
  Object.entries(parseQueryString(queryString)).reduce((acc, [key, value]) => {
    const valueAsJson = _.flatten([value]).map(arrValue => {
      const parsingArrayValueAsJsonResult = parseJsonSafe(arrValue ?? '');
      return parsingArrayValueAsJsonResult.status === 'OK' ? parsingArrayValueAsJsonResult.result : arrValue;
    });

    return _.set(acc, key, valueAsJson?.length === 1 ? valueAsJson[0] : valueAsJson);
  }, {});


export const definePayloadType = (headers: IncomingMessage['headers']): TRequestPayloadType | null => {
  const contentTypeKey = Object.keys(headers).find((key) => key.toLowerCase() === 'content-type');
  const contextType = _.flatten([_.get(headers, contentTypeKey ?? '', '')]).join(',').toLowerCase();

  if (contextType.includes('application/json')) {
    return 'json'
  }
  if (contextType.includes('/xml')) {
    return 'xml'
  }

  return null;
}

export const extractHttpIncommingContext = async (request: IncomingMessage): Promise<IRequestContextIncoming> => {
  const { pathname, query: rawQuery } = parseUrl(request.url ?? '');

  const query = parseQuerySearch(rawQuery ?? '');
  const raw = await new Promise<Buffer | null>((resolve, reject) =>
    bodyParser.raw({ limit: '10mb', type: '*/*' })(request, new ServerResponse(request), (error) =>
      error
        ? reject(error)
        : resolve(Buffer.isBuffer(_.get(request, 'body')) ? _.get(request, 'body') : null)
    )
  );

  const parsed = raw?.length
    ? parsePayload(raw, definePayloadType(request.headers) ?? 'plain')
    : null;

  return {
    query,

    type: parsed?.type ?? 'plain',

    method: String(request.method ?? 'GET').toUpperCase(),
    path: pathname ?? '/',

    headers: formatHeaders(request.headers),
    data: parsed?.data ?? undefined,

    raw: {
      data: raw ?? undefined,
    }
  };
}
