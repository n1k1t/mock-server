import URL from 'url';
import type { WebSocket } from '../model';

export class WebSocketConnectionError extends Error {
  public url: string = 'none';

  constructor(
    public ws: WebSocket,
    public reason?: Error
  ) {
    const { protocol, host, pathname } = URL.parse(ws.url);
    const url = `${protocol}//${host}${pathname}`;

    super(
      reason
        ? `WebSocket connection to [${url}] got error [${reason?.message ?? reason}]`
        : `Cannot connect webSocket to [${url}]`
    );

    Object.assign(this, { url });
  }

  static build(ws: WebSocket, predicate?: unknown) {
    const reason = predicate instanceof Error
      ? predicate
      : predicate
        ? new Error(String(predicate))
        : null;

    return reason instanceof WebSocketConnectionError
      ? reason
      : new WebSocketConnectionError(ws, reason ?? ws.error ?? new Error('Unknown'));
  }
}
