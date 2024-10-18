import { AxiosInstance, AxiosError } from 'axios';

import { IBaseRouteResponse } from '../server/models';
import { IRequestConfiguration } from './errors/types';
import { ConnectionError, InternalServerError, ValidationError } from './errors';

export const buildClientMethod = <T extends TFunction<any, any[]>>(handler: TFunction<T, [AxiosInstance]>) => handler;

export const handleRequestError = (error: AxiosError<IBaseRouteResponse<any>>) => {
  const configuration: IRequestConfiguration = {
    baseURL: error.config.baseURL,
    method: error.config.method,
    url: error.config.url,
  };

  if (!error.response) {
    throw new ConnectionError(configuration);
  }

  switch(error.response?.data.status) {
    case 'INTERNAL_ERROR': {
      throw new InternalServerError(configuration, error.response?.data.data?.message);
    }
    case 'VALIDATION_ERROR': {
      throw new ValidationError(configuration, error.response?.data.data?.reasons);
    }
  }

  throw new InternalServerError(configuration, error.message);
}
