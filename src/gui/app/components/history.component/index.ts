import _pick from 'lodash/pick';
import hbs from 'handlebars';

import type { History } from '../../../../server';

import { ViewerComponent } from '../viewer.component';
import { Component } from '../../models';

const template = require('./template.hbs');
const render = hbs.compile(template);

export class HistoryComponent extends Component {
  public viewer = ViewerComponent.build({ depth: 2 }).hide();

  constructor(public data: History['TPlain']) {
    super();
    this.refresh();
  }

  public provide(data: History['TPlain']) {
    return Object.assign(this, { data });
  }

  public refresh(): this {
    this.replace(render(this.data)).append(this.viewer);

    this.viewer.provide({
      event: this.data.snapshot.event,
      transport: this.data.snapshot.transport,

      ...(Object.keys(this.data.snapshot.flags).length && { flags: this.data.snapshot.flags }),
      ...(this.data.expectation && {
        expectation: {
          id: this.data.expectation.id,
          group: this.data.expectation.group,

          ...(this.data.expectation.schema.forward && { forward: this.data.expectation.schema.forward }),
        },
      }),

      ...(this.data.snapshot.cache?.isEnabled && { cache: this.data.snapshot.cache }),
      ...(this.data.snapshot.seed && { seed: this.data.snapshot.seed }),
      ...(this.data.snapshot.container && { container: this.data.snapshot.container }),

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

    return light || [
      this.data.snapshot.incoming.query,
      this.data.snapshot.incoming.headers,
      this.data.snapshot.outgoing.headers,
      this.data.snapshot.container,
      this.data.snapshot.state,
      this.data.snapshot.cache,
    ].some((value) => JSON.stringify(value)?.includes(query))
  }

  static build(history: History['TPlain']) {
    return new HistoryComponent(history);
  }
}
