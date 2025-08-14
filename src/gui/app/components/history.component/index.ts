import hbs from 'handlebars';

import type { History } from '../../../../server';

import { TSettingsVisualPathSize } from '../../types';
import { ViewerComponent } from '../viewer.component';
import { Component } from '../../models';

const template = hbs.compile(require('./template.hbs'));

export class HistoryComponent extends Component {
  public TOptions!: {
    pathSize?: TSettingsVisualPathSize;
  };

  public viewer = ViewerComponent.build({ depth: 2 }).hide();

  constructor(public data: History['TPlain'], options?: HistoryComponent['TOptions']) {
    super();
    this.refresh(options);
  }

  public provide(data: History['TPlain']) {
    return Object.assign(this, { data });
  }

  public refresh(options?: HistoryComponent['TOptions']): this {
    this.replace(template({ options, data: this.data })).append(this.viewer);

    this.viewer.provide({
      event: this.data.snapshot.event,
      transport: this.data.snapshot.transport,

      ...(this.data.snapshot.seed && { seed: this.data.snapshot.seed }),
      ...(this.data.snapshot.container && { container: this.data.snapshot.container }),

      ...(Object.keys(this.data.snapshot.flags).length && { flags: this.data.snapshot.flags }),
      ...(Object.keys(this.data.snapshot.state).length && { state: this.data.snapshot.state }),

      ...(this.data.expectation && {
        expectation: {
          id: this.data.expectation.id,
          group: this.data.expectation.group,

          ...(this.data.expectation.schema.forward && { forward: this.data.expectation.schema.forward }),
        },
      }),

      ...((this.data.snapshot.cache.hasRead || this.data.snapshot.cache.hasWritten) && {
        cache: this.data.snapshot.cache,
      }),

      incoming: this.data.snapshot.incoming,

      ...(this.data.snapshot.error && { error: this.data.snapshot.error }),
      ...(this.data.status === 'completed' && { outgoing: this.data.snapshot.outgoing }),
      ...(this.data.snapshot.forwarded && { forwarded: this.data.snapshot.forwarded }),
      ...(this.data.snapshot.messages?.length && { messages: this.data.snapshot.messages }),
    });

    this.element.querySelector('div.meta')!.addEventListener('click', (event) =>
      event.composedPath().some((element) => (<Element>element)?.classList?.contains('meta'))
        ? this.viewer.isHidden ? this.viewer.show() : this.viewer.hide()
        : null
    );

    return this;
  }

  public match(query: string): boolean {
    const light = [
      this.data.group,
      this.data.expectation?.name,
      this.data.snapshot.incoming.path,
      this.data.snapshot.incoming.method,
      this.data.snapshot.incoming.dataRaw,
      this.data.snapshot.incoming.error,
      String(this.data.snapshot.outgoing.status),
      String(this.data.snapshot.seed ?? ''),
      this.data.snapshot.outgoing.dataRaw,
    ].some((value) => value?.includes(query));

    if (light) {
      return true;
    }

    return light || [
      this.data.snapshot.incoming.query,
      this.data.snapshot.incoming.headers,
      this.data.snapshot.outgoing.headers,
      this.data.snapshot.container,
      this.data.snapshot.state,
      this.data.snapshot.cache,
    ].some((value) => JSON.stringify(value)?.includes(query))
  }

  static build(data: History['TPlain'], options?: HistoryComponent['TOptions']) {
    return new HistoryComponent(data, options);
  }
}
