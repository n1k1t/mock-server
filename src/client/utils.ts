import { AxiosError } from 'axios';
import rfdc from 'rfdc';
import _ from 'lodash';

import { ConnectionError, InternalServerError, ValidationError } from './errors';
import { Expectation, introspectExpectationSchema } from '../expectations';
import type { IRequestConfiguration } from './errors/types';
import type { IBaseRouteResponse } from '../server/models';

const clone = rfdc();

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

export const prepareExpectationToRequest = <T extends PartialDeep<Expectation>>(body: T): object => {
  const result = clone(body);

  introspectExpectationSchema(result.request ?? {}, (key, segment) => {
    if (key === '$exec') {
      _.set(segment, key, segment.$exec?.toString());
    }
  });

  introspectExpectationSchema(result.response ?? {}, (key, segment) => {
    if (key === '$exec') {
      _.set(segment, key, segment.$exec?.toString());
    }
  });

  return result;
}
