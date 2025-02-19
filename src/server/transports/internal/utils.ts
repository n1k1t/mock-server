import type { IEndpointResponse } from '../../models';

export const buildEndpointResponse = <T>(
  code: IEndpointResponse<T>['code'],
  data: IEndpointResponse<T>['data']
): IEndpointResponse<T> => ({ timestamp: Date.now(), code, data });
