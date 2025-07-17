import { Provider, RequestContextSnapshot } from '../../models';
import { Expectation } from '../../../expectations';
import { History } from './model';

import config from '../../../config';

export class HistoryStorage extends Map<string, History> {
  private stack: string[] = [];

  constructor(protected configuration: Pick<History, 'group'>) {
    super();
  }

  /** Registers history item */
  public register(predicate: History | Omit<History['configuration'], 'group'>): History {
    const history = predicate instanceof History ? predicate : History.build({
      status: 'registered',

      group: this.configuration.group,
      snapshot: predicate.snapshot,
    });

    this.set(history.id, history);

    if (this.stack.push(history.id) > config.get('history').limit) {
      this.delete(this.stack.shift()!);
    }

    return history;
  }

  /** Injects and registers history items from plain */
  public inject(list: History['TPlain'][]): this {
    const fake = Provider.build({ group: this.configuration.group });

    list.forEach((history) => this.register(
      History.build({
        id: history.id,

        group: history.group,
        status: history.status,

        timestamp: history.timestamp,
        duration: history.duration,

        ...(history.expectation && { expectation: Expectation.build(history.expectation) }),

        snapshot: RequestContextSnapshot.build({
          transport: history.snapshot.transport,
          event: history.snapshot.event,
          flags: history.snapshot.flags,

          cache: history.snapshot.cache,
          state: history.snapshot.state,
          error: history.snapshot.error,

          incoming: history.snapshot.incoming,
          outgoing: history.snapshot.outgoing,
          messages: history.snapshot.messages,

          seed: history.snapshot.seed,
          storage: fake.storages.containers,

          ...(history.snapshot.forwarded && {
            forwarded: {
              isCached: history.snapshot.forwarded.isCached,
              messages: history.snapshot.forwarded.messages,

              incoming: Object.assign(history.snapshot.forwarded.incoming, {
                dataRaw: history.snapshot.forwarded.incoming.dataRaw
                  ? Buffer.from(history.snapshot.forwarded.incoming.dataRaw)
                  : undefined,
              }),

              ...(history.snapshot.forwarded.outgoing && {
                outgoing: Object.assign(history.snapshot.forwarded.outgoing, {
                  dataRaw: history.snapshot.forwarded.outgoing.dataRaw
                    ? Buffer.from(history.snapshot.forwarded.outgoing.dataRaw)
                    : undefined,
                }),
              }),
            },
          }),
        })
      }))
    );

    return this;
  }

  /** Removes history item from storage */
  public unregister(history?: History): this {
    if (history) {
      this.delete(history.switchStatus('unregistered').id);
      this.stack.splice(this.stack.indexOf(history.id), 1);
    }

    return this;
  }

  /** Clears storage */
  public clear(): void {
    this.stack = [];
    super.clear();
  }
}
