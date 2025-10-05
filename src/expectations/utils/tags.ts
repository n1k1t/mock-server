import { IExpectationMeta, TExpectationOperatorLocation } from '../types';
import { TFunction } from '../../../types';
import { cast } from '../../utils';

export const mergeMetaTags = (tags: IExpectationMeta['tags'][]): IExpectationMeta['tags'] => {
  const acc = {
    incoming: {
      path: cast<string[]>([]),
      error: cast<string[]>([]),
      method: cast<string[]>([]),
    },

    outgoing: {
      status: cast<number[]>([]),
    },

    forward: {
      url: cast<string | undefined>(undefined),
    },
  } satisfies IExpectationMeta['tags'];

  tags.forEach((nested) => {
    acc.incoming.path.push(...(nested.incoming?.path ?? []));
    acc.incoming.error.push(...(nested.incoming?.error ?? []));
    acc.incoming.method.push(...(nested.incoming?.method ?? []));

    acc.outgoing.status.push(...(nested.outgoing?.status ?? []));
    acc.forward.url = nested.forward?.url ?? acc.forward.url;
  });

  return acc;
}

export const compileMetaTagsAccumulator =
  (location: TExpectationOperatorLocation): TFunction<IExpectationMeta['tags'], [unknown[]]> | null => {
    switch(location) {
      case 'path':
      case 'incoming.path': return (values): IExpectationMeta['tags'] => ({
        incoming: { path: values.map(String) },
      });

      case 'method':
      case 'incoming.method': return (values): IExpectationMeta['tags'] => ({
        incoming: { method: values.map(String) },
      });

      case 'error': return (values): IExpectationMeta['tags'] => ({
        incoming: { error: values.map(String) },
      });

      case 'outgoing.status': return (values): IExpectationMeta['tags'] => ({
        outgoing: { status: values.map(Number) },
      });

      default: return null;
    }
  }
