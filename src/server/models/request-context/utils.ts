import { IncomingMessage } from 'http';
import { parse as parseUrl } from 'url';
import { parse as parseQueryString } from 'querystring';
import _ from 'lodash';

import { parseJsonSafe } from '../../../utils';
import { TRequestMethod, TRequestPayloadType } from '../../../types';
import { IRequestPlainContext } from './types';

const extractHttpQuerySearchParams = (queryString: string) => {
  return Object.entries(parseQueryString(queryString)).reduce((acc, [key, value]) => {
    const valueAsJson = _.flatten([value]).map(arrValue => {
      const parsingArrayValueAsJsonResult = parseJsonSafe(arrValue ?? '');
      return parsingArrayValueAsJsonResult.status === 'OK' ? parsingArrayValueAsJsonResult.result : arrValue;
    });

    return _.set(acc, key, valueAsJson?.length === 1 ? valueAsJson[0] : valueAsJson);
  }, {});
}

export const extractHttpPayloadType = (headers: IncomingMessage['headers']): TRequestPayloadType => {
  const contentTypeKey = Object.keys(headers).find((key) => key.toLowerCase() === 'content-type');
  const contextType = _.flatten([_.get(headers, contentTypeKey ?? '', '')]).join(',').toLowerCase();

  if (contextType.includes('application/json')) {
    return 'json'
  }
  if (contextType.includes('text/xml')) {
    return 'xml'
  }

  return 'plain';
}

export const extractHttpIncommingParameters = async (
  request: IncomingMessage
): Promise<IRequestPlainContext> => {
  let bodyRaw = '';

  request.on('data', chunk => bodyRaw += chunk);
  await new Promise(resolve => request.on('end', resolve));

  const { pathname, query: rawQuery } = parseUrl(request?.url ?? '');
  const parsingBodyResult = parseJsonSafe(bodyRaw);
  const query = extractHttpQuerySearchParams(rawQuery ?? '');

  return {
    payloadType: extractHttpPayloadType(request.headers),

    method: <TRequestMethod>request.method ?? 'GET',
    path: pathname ?? '/',

    query,

    body: parsingBodyResult.status === 'OK' ? parsingBodyResult.result : undefined,
    bodyRaw,

    headers: Object
      .entries(request.headers)
      .map(([name, values]) => [
        name.toLowerCase(),
        _.flatten([values]).map((value) => String(value)).sort().join(',')
      ])
      .reduce((acc, [name, value]) => _.set(acc, name, value), {}),
  }
}
