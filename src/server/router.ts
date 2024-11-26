import _ from 'lodash';

import type { SetRequiredKeys } from '../types';
import type { Endpoint } from './models';

import * as endpoints from './endpoints';

interface IRoutes {
  http: Record<string, SetRequiredKeys<Endpoint, 'http'>>;
  ws: Record<string, SetRequiredKeys<Endpoint, 'ws'>>;
};

export const routes = Object.values(endpoints).reduce((acc, endpoint) => {
  if (endpoint.http) {
    _.set(acc, ['http', `${endpoint.http.method}:${endpoint.http.path}`], endpoint);
  }
  if (endpoint.ws) {
    _.set(acc, ['ws', endpoint.ws.path], endpoint);
  }

  return acc;
}, <IRoutes>{ http: {}, ws: {} });
