import type { SystemHttpRequestContext, SystemSocketIoRequestContext } from '../transports';
import type { TFunction } from '../../../types';

type TEndpointHandler<TSchema extends IEndpointSchema<any>> = TFunction<any, [
  (SystemHttpRequestContext<TSchema['outgoing']['data']> | SystemSocketIoRequestContext<TSchema['outgoing']['data']>) & {
    incoming: TSchema['incoming'];
  }
]>;

export interface IEndpointResponse<T> {
  code: 'OK' | 'INTERNAL_ERROR' | 'VALIDATION_ERROR' | 'NOT_FOUND';
  timestamp: number;

  data: T;
}

export interface IEndpointInput {
  incoming?: {
    query?: any;
    data?: any;
  };

  outgoing?: any;
}

export interface IEndpointSchema<TInput extends IEndpointInput = {}> {
  locations: {
    http?: {
      method: string;
      path: string;
    };

    io?: {
      path: string;
    };
  };

  incoming: {
    query?: NonNullable<TInput['incoming']>['query'];
    data?: NonNullable<TInput['incoming']>['data'];
  };

  outgoing: IEndpointResponse<TInput['outgoing']>;
}

export class EndpointFactory<TSchema extends IEndpointSchema<any> = any> {
  public TSchema!: TSchema;
  private provided: IEndpointSchema['locations'] = {};

  public http<
    T extends NonNullable<IEndpointSchema['locations']['http']>,
    TReturn extends EndpointFactory<{
      locations: {
        http: T;
        io: TSchema['locations']['io'];
      };

      incoming: TSchema['incoming'];
      outgoing: TSchema['outgoing'];
    }>
  >(payload: T): TReturn {
    this.provided.http = payload;
    return <this & TReturn>this;
  }

  public io<
    T extends NonNullable<IEndpointSchema['locations']['io']>,
    TReturn extends EndpointFactory<{
      locations: {
        http: TSchema['locations']['http'];
        io: T;
      };

      incoming: TSchema['incoming'];
      outgoing: TSchema['outgoing'];
    }>
  >(payload: T): TReturn {
    this.provided.io = payload;
    return <this & TReturn>this;
  }

  public compile(handler: TEndpointHandler<TSchema>): Endpoint<TSchema> {
    if (!this.provided.http && !this.provided.io) {
      throw new Error('Cannot compile endpoint without locations');
    }

    return new Endpoint(this.provided, handler);
  }

  static build<TInput extends IEndpointInput>(): EndpointFactory<IEndpointSchema<TInput>> {
    return new EndpointFactory();
  }
}

export class Endpoint<TSchema extends IEndpointSchema = any> {
  public TSchema!: TSchema;

  constructor(
    public locations: TSchema['locations'],
    public handler: TEndpointHandler<TSchema>
  ) {}
}
