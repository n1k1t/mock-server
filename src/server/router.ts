import _ from 'lodash';

import type { RequestContext, Endpoint } from './models';
import * as endpoints from './endpoints';

interface IInternalEndpointsMap {
  http: Record<string, SetRequiredKeys<Endpoint, 'http'>>;
  ws: Record<string, SetRequiredKeys<Endpoint, 'webSocket'>>;
}

export const internalEndpointsMap = Object.values(endpoints).reduce((acc, endpoint) => {
  if (endpoint.http) {
    _.set(acc, ['http', `${endpoint.http.method}:${endpoint.http.path}`], endpoint);
  }
  if (endpoint.webSocket) {
    _.set(acc, ['ws', endpoint.webSocket.path], endpoint);
  }

  return acc;
}, <IInternalEndpointsMap>{ http: {}, ws: {} });

export const resolveInternalEndpoint =
  (requestContext: SetRequiredKeys<RequestContext, 'flow'>): { handle: TFunction } | null => {
    const key = [requestContext.method, requestContext.path].filter(Boolean).join(':');
    const endpoint = internalEndpointsMap[requestContext.flow][key];

    return endpoint?.handler
      ? { handle: () => (endpoint.handler!)(requestContext) }
      : null;
  }
