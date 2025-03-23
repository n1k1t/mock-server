import { Executor, ExecutorManualError, IExecutorExecOptions, IRequestContextOutgoing } from '../../models';
import { WsRequestContext } from './context';
import { parseJsonSafe } from '../../../utils';
import { Logger } from '../../../logger';

const logger = Logger.build('Server.Transports.Ws.Executor');

export class WsExecutor extends Executor<WsRequestContext> {
  public async exec(context: WsRequestContext, options?: IExecutorExecOptions) {
    context.socket.once('close', () => context.complete());

    if (context.event === 'connection') {
      context.socket.on('message', (data) => {
        const serialized = data.toString();
        context.streams.incoming.next(parseJsonSafe(serialized).result ?? serialized);
      });
    }

    await super.exec(context, options).catch((error) => {
      if (error instanceof ExecutorManualError && error.is('ECONNABORTED')) {
        return context.socket.close();
      }

      logger.error('Got unexpected error while execution', error?.stack ?? error);
    });

    return context.event === 'connection' ? context : context.complete();
  }

  public async match(context: WsRequestContext) {
    const expectation = context.provider.storages.expectations.match(context.snapshot);

    if (!expectation) {
      context.event === 'connection' ? context.skip() : logger.warn('Expectation was not found');
      return null;
    }

    return expectation;
  }

  public async prepare(context: WsRequestContext) {
    if (context.snapshot.flags.wsCloseConnection) {
      context.socket.close(context.snapshot.outgoing.status || 1000);
      return context.complete();
    }
  }

  public async forward() {
    return null;
  }

  public async reply(context: WsRequestContext, outgoing: IRequestContextOutgoing) {
    await outgoing.stream?.forEach((message) => {
      context.streams.outgoing.next(message);
      context.socket.send(typeof message === 'object' ? JSON.stringify(message) : String(message));
    });

    if (context.event === 'connection' || context.snapshot.flags.wsCloseConnection) {
      context.socket.close(outgoing.status || 1000);
    }

    return outgoing;
  }
}
