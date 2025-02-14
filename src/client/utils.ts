import { AxiosError } from 'axios';
import rfdc from 'rfdc';
import _ from 'lodash';

import type { IRequestConfiguration } from './errors';
import type { IEndpointResponse } from '../server';

import { ConnectionError, InternalServerError, ValidationError } from './errors';
import { Expectation, serializeExpectationSchema } from '../expectations';

export const handleRequestError = (error: AxiosError<IEndpointResponse<any>>) => {
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

export const prepareExpectationBodyToRequest = <T extends Partial<Expectation<any>['TPlain']>>(body: T): T => ({
  ...body,

  schema: {
    ...body.schema,
    ...(body.schema?.request && { request: serializeExpectationSchema(body.schema.request) }),
    ...(body.schema?.response && { response: serializeExpectationSchema(body.schema.response) }),
  }
});
