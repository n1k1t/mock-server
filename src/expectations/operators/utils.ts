import { cast } from '../../utils';
import type { IRequestPlainContext, IResponsePlainContext } from '../../server/models';
import {
  TExpectationOperatorLocation,
  TExpectationOperatorHandler,
  TExpectationOperator,
} from '../types';

type TBasePayloadSegment = { parent: object, key: string };
type TPayloadSegment =
  | (TBasePayloadSegment & { value: object, type: 'object' })
  | (TBasePayloadSegment & { value: string, type: 'string' })
  | (TBasePayloadSegment & { value: number, type: 'number' });

export const buildExpectationOperatorHandler = <K extends TExpectationOperator>(
  handler: TExpectationOperatorHandler<K>
) => handler;

export const extractContextPayloadSegment = (
  location: TExpectationOperatorLocation,
  context: IRequestPlainContext | IResponsePlainContext
): TPayloadSegment | null => {
  switch(location) {
    case 'headers': return cast<TPayloadSegment>({
      key: 'headers',
      type: 'object',
      parent: context,
      value: context.headers!,
    });

    case 'method': return 'method' in context
      ? cast<TPayloadSegment>({
        key: 'method',
        type: 'string',
        parent: context,
        value: context.method,
      })
      : null;

    case 'path': return 'path' in context
      ? cast<TPayloadSegment>({
        key: 'path',
        type: 'string',
        parent: context,
        value: context.path,
      })
      : null;

    case 'body': return 'body' in context
      ? ({
        key: 'body',
        type: 'object',
        parent: context,
        value: context.body!,
      })
      : null;

    case 'data': return 'data' in context
      ? ({
        key: 'data',
        type: 'object',
        parent: context,
        value: context.data!,
      })
      : null;

    case 'statusCode': return 'statusCode' in context
      ? ({
        key: 'statusCode',
        type: 'number',
        parent: context,
        value: context.statusCode!,
      })
      : null;

    case 'query': return 'query' in context
      ? ({
        key: 'query',
        type: 'object',
        parent: context,
        value: context.query!,
      })
      : null;

    default: return null;
  }
}
