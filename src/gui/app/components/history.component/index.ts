import JsonFormatHighlight from '../../../../../../json-formatter';
import _pick from 'lodash/pick';
import hbs from 'handlebars';

import type { History } from '../../../../server';
import { Component } from '../../models';

import context from '../../context';

const template = require('./template.hbs');
const render = hbs.compile(template);

export class HistoryComponent extends Component {
  public isExpanded: boolean = false;

  constructor(public data: History['TPlain']) {
    super();
    this.refresh(data);
  }

  public refresh(data: History['TPlain']) {
    this.clear().append(render(data));

    const pre = this.element.querySelector('pre')!;
    const formatted = {
      event: data.snapshot.event,

      ...(Object.keys(data.snapshot.flags).length && { flags: data.snapshot.flags }),
      ...(data.expectation && {
        expectation: {
          id: data.expectation.id,
          group: data.expectation.group,

          ...(data.expectation.schema.forward && { forward: data.expectation.schema.forward }),
        },
      }),

      ...(data.snapshot.cache?.isEnabled && { cache: data.snapshot.cache }),
      ...(data.snapshot.seed && { seed: data.snapshot.seed }),
      ...(data.snapshot.container && { container: data.snapshot.container }),

      incoming: data.snapshot.incoming,

      ...(data.snapshot.error && { error: data.snapshot.error }),
      ...(data.status === 'completed' && { outgoing: data.snapshot.outgoing }),
      ...(data.snapshot.forwarded && { forwarded: data.snapshot.forwarded }),
      ...(data.snapshot.messages?.length && { messages: data.snapshot.messages }),
    };

    if (this.isExpanded) {
      pre.classList.remove('hidden');
    }

    const json = new JsonFormatHighlight(formatted, 2, {
      theme: 'custom',
      afterCopyHandler: () => context.shared.popups.push('Copied!', { icon: 'fas fa-clone', level: 'info' }),
    });

    pre.appendChild(json.render());

    this.element.querySelector('div.meta')!.addEventListener('click', (event) => {
      if (event.composedPath().some((element) => (<Element>element)?.classList?.contains('meta')) === false) {
        return null;
      }

      pre.classList.toggle('hidden');
      this.isExpanded = !this.isExpanded;
    });
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
