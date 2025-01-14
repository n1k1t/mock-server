import { AxiosError } from 'axios';
import rfdc from 'rfdc';
import _ from 'lodash';

import type { IRequestConfiguration } from './errors';
import type { IEndpointResponse } from '../server';

import { ConnectionError, InternalServerError, ValidationError } from './errors';
import { serializeRegExp } from '../utils';
import {
  Expectation,
  IExpectationOperatorsSchema,
  introspectExpectationOperatorsSchema,
} from '../expectations';

const clone = rfdc();

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

export const prepareExpectationBodyToRequest = <T extends Partial<Expectation<any>['TPlain']>>(body: T): T => {
  const cloned = clone(body.schema ?? {});

  Object
    .entries(<Record<string, IExpectationOperatorsSchema>>_.pick(body.schema ?? {}, ['request', 'response']))
    .forEach(([name, segment]) =>
      introspectExpectationOperatorsSchema(segment, (key, schema, path) => {
        if (key === '$exec') {
          _.set(cloned, `${name}.${path}`, schema.$exec?.toString());
        }

        if (key === '$has' && schema.$has?.$regExp) {
          _.set(cloned, `${name}.${path}.$regExp`, serializeRegExp(schema.$has.$regExp));
        }
        if (key === '$has' && schema.$has?.$regExpAnyOf) {
          _.set(cloned, `${name}.${path}.$regExpAnyOf`, schema.$has.$regExpAnyOf.map((expr) => serializeRegExp(expr)));
        }

        if (key === '$has' && schema.$has?.$exec) {
          _.set(cloned, `${name}.${path}.$exec`, schema.$has.$exec.toString());
        }
        if (key === '$set' && schema.$set?.$exec) {
          _.set(cloned, `${name}.${path}.$exec`, schema.$set.$exec.toString());
        }
        if (key === '$merge' && schema.$merge?.$exec) {
          _.set(cloned, `${name}.${path}.$exec`, schema.$merge.$exec.toString());
        }
        if (key === '$switch' && schema.$switch?.$exec) {
          _.set(cloned, `${name}.${path}.$exec`, schema.$switch.$exec.toString());
        }
      })
    );

  return { ...body, schema: cloned };
}
