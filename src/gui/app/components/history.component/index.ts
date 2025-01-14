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

  constructor(public history: History['TPlain']) {
    super();
    this.refresh(history);
  }

  public refresh(history: History['TPlain']) {
    this.clear().append(render(history));

    const pre = this.element.querySelector('div.history > pre')!;
    const formatted = {
      event: history.snapshot.event,

      ...(Object.keys(history.snapshot.flags).length && { flags: history.snapshot.flags }),
      ...(history.expectation && {
        expectation: {
          id: history.expectation.id,
          group: history.expectation.group,

          ...(history.expectation.schema.forward && { forward: history.expectation.schema.forward }),
        },
      }),

      ...(history.snapshot.cache?.isEnabled && { cache: history.snapshot.cache }),
      ...(history.snapshot.seed && { seed: history.snapshot.seed }),
      ...(history.snapshot.container && { container: history.snapshot.container }),

      incoming: history.snapshot.incoming,

      ...(history.status === 'completed' && { outgoing: history.snapshot.outgoing }),
      ...(history.snapshot.forwarded && { forwarded: history.snapshot.forwarded }),
      ...(history.snapshot.messages?.length && { messages: history.snapshot.messages }),
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

  static build(history: History['TPlain']) {
    return new HistoryComponent(history);
  }
}
