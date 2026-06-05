import merge from 'deepmerge';

import { IWebSocketConfiguration } from './types';
import { WebSocket } from './model';

export class WebSocketFactory {
  constructor(public configuration: Partial<IWebSocketConfiguration>) {}

  public compile<TIncoming extends object, TOutgoing = unknown>(
    configuration?: Partial<IWebSocketConfiguration>
  ) {
    return WebSocket.build<TIncoming, TOutgoing>(
      Object.assign(merge(this.configuration, configuration ?? {}), {
        signal: configuration?.signal ?? this.configuration.signal,
      })
    );
  }

  static build(configuration: Partial<IWebSocketConfiguration>) {
    return new WebSocketFactory(configuration);
  }
}
