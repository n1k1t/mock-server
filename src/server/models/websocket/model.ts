import qs from 'qs';

import { WebSocket as WebSocketOriginal } from 'ws';
import { IncomingHttpHeaders } from 'http';
import { Observer, Subject } from 'rxjs';

import { WebSocketConnectionError } from './errors';
import { IWebSocketConfiguration } from './types';
import { RequestMessage } from '../message';
import { cast, wait } from '../../../utils';
import { TFunction } from '../../../../types';
import { Logger } from '../../../logger';

const logger = Logger.build('Ws');

const webSocketClosingStates: WebSocketOriginal['readyState'][] = [
  WebSocketOriginal.CLOSED,
  WebSocketOriginal.CLOSING
];

export class WebSocket<TIncoming = any, TOutgoing = any> {
  public observable = new Subject<RequestMessage<TIncoming>>();

  private nested = {
    headers: cast<IncomingHttpHeaders | null>(null),
    source: cast<WebSocketOriginal | null>(null),

    status: cast<number | null>(null),
    error: cast<WebSocketConnectionError | null>(null),
  };

  constructor(
    public url: string,
    public configuration: Omit<IWebSocketConfiguration, 'url'>
  ) {}

  public get error(): WebSocketConnectionError | null {
    return this.nested.error;
  }

  public async headers(): Promise<IncomingHttpHeaders> {
    if (this.nested.headers) {
      return this.nested.headers;
    }

    return new Promise<IncomingHttpHeaders>((resolve) =>
      this.nested.source?.once('upgrade', (request) => resolve(request.headers))
    );
  }

  public async status(): Promise<number> {
    if (this.nested.status !== null) {
      return this.nested.status
    }

    return new Promise<number>((resolve) =>
      this.nested.source?.once('close', (code) => resolve(code))
    );
  }

  public subscribe(observer: Partial<Observer<RequestMessage<TIncoming>>>): this {
    this.observable.subscribe({
      error: observer.error ?? (() => null),
      next: observer.next,
      complete: observer.complete,
    });

    return this;
  }

  public forEach(handler: TFunction<unknown, [RequestMessage<TIncoming>]>): Promise<void> {
    return this.observable.forEach(handler);
  }

  public waitUntilComplete(): Promise<void> {
    return new Promise<void>((resolve) => this.subscribe({ complete: resolve }));
  }

  public checkIsConnected(): boolean {
    return this.nested.source?.readyState === 1;
  }

  public async send(payload: TOutgoing): Promise<void> {
    await this.resolve();

    if (!this.checkIsConnected()) {
      throw WebSocketConnectionError.build(this, 'Is not connected anymore');
    }

    return new Promise(
      (resolve, reject) =>
        this.nested.source?.send(typeof payload === 'object' ? JSON.stringify(payload) : String(payload), (error) =>
          error ? reject(error) : resolve()
        )
    );
  }

  public connect(): this {
    try {
      this.nested.source = new WebSocketOriginal(this.url, this.configuration);

      this.nested.source.once('close', (code: number) => this.close(code));
      this.nested.source.once('upgrade', (request) => this.nested.headers = request.headers);

      this.nested.source.on('message', (payload) => this.observable.next(RequestMessage.build(payload)));

      this.nested.source.on('error', (error) => {
        if (!webSocketClosingStates.includes(this.nested.source!.readyState)) {
          this.observable.error(WebSocketConnectionError.build(this, error));
          this.close();
        }
      });

      if (this.configuration.signal) {
        this.configuration.signal.aborted
          ? this.handleAbortSignal()
          : this.configuration.signal.addEventListener('abort', () => this.handleAbortSignal());
      }

      this.scheduleConnectionClosing();
      return this;
    } catch (error) {
      this.nested.error = WebSocketConnectionError.build(this, error);
      this.observable.error(this.nested.error);

      return this;
    }
  }

  public close(status?: number): void {
    if (typeof status === 'number' && this.nested.status === null) {
      this.nested.status = status;
    }

    this.nested.source?.close();
    setImmediate(() => this.observable.complete());
  }

  /** Resolves `connecting` ready state of the web socket */
  private async resolve(): Promise<void | null> {
    if (!this.nested.source) {
      throw WebSocketConnectionError.build(this, this.nested.error ?? 'Connection was not estabilished');
    }
    if (this.configuration.signal?.aborted) {
      return null;
    }

    if (this.nested.source.readyState === this.nested.source.CONNECTING) {
      await Promise.race([
        new Promise((resolve) => this.nested.source!.once('open', resolve)),
        new Promise((resolve) => this.nested.source!.once('close', resolve)),
        new Promise((resolve, reject) => this.nested.source!.once('error', reject)),
        new Promise((resolve) => this.configuration.signal?.addEventListener('abort', resolve)),
      ]).catch((error) => {
        logger.error('Got error while resolving connection', error?.stack ?? error);
        throw WebSocketConnectionError.build(this, error);
      });
    }
  }

  private handleAbortSignal(): void {
    if (!this.nested.source) {
      throw WebSocketConnectionError.build(this, this.nested.error ?? 'Connection was not estabilished');
    }

    if (!webSocketClosingStates.includes(this.nested.source.readyState)) {
      logger.warn(
        `Outgoing request [WS ${this.url}] has aborted using abort controller`,
        `[${this.configuration.signal?.reason}]`
      );
    }

    this.close();
  }

  private async scheduleConnectionClosing(): Promise<void | null> {
    if (!this.nested.source) {
      throw WebSocketConnectionError.build(this, this.nested.error ?? 'Connection was not estabilished');
    }
    if (!this.configuration.timeout) {
      return null;
    }

    if (!webSocketClosingStates.includes(this.nested.source.readyState)) {
      const timer = wait(this.configuration.timeout);

      await Promise.race([timer, new Promise((resolve) => this.nested.source!.once('close', resolve))]).then(() =>
        timer.abort()
      );
    }

    if (!webSocketClosingStates.includes(this.nested.source.readyState)) {
      logger.info(`Connection has closed by timeout [${this.configuration.timeout}]`);
    }

    this.close();
  }

  static build<TIncoming, TOutgoing = any>(configuration: IWebSocketConfiguration) {
    const query = configuration.query ? `?${qs.stringify(configuration.query)}` : '';
    const url = configuration.url
      ? configuration.baseURL
        ? `${configuration.baseURL.replace(/\/$/, '')}/${configuration.url.replace(/^\//, '')}${query}`
        : `${configuration.url}${query}`
      : configuration.baseURL
        ? `${configuration.baseURL}${query}`
        : null;

    if (!url) {
      throw new Error('[url] is invalid');
    }

    return new WebSocket<TIncoming, TOutgoing>(url, configuration);
  }
}
