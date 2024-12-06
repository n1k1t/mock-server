import JsonFormatHighlight from '../../../../../../json-formatter';
import _pick from 'lodash/pick';
import hbs from 'handlebars';

import type { History } from '../../../../server/history';
import { Component } from '../../models';

import context from '../../context';

const template = require('./template.hbs');
const render = hbs.compile(template);

export class HistoryComponent extends Component {
  constructor(public history: History['TPlain']) {
    super();
    this.refresh(history);
  }

  public refresh(history: History['TPlain']) {
    this.clear().append(render(history));

    const pre = this.element.querySelector('pre')!;

    this.element.addEventListener('click', (event) => {
      if (event.composedPath().some((element) => (<Element>element)?.classList?.contains('meta')) === false) {
        return null;
      }

      if (!this.element.querySelector('pre div.json-formatter-row')) {
        const formatted = {
          incoming: history.snapshot.incoming,

          ...(history.snapshot.seed && { seed: history.snapshot.seed }),
          ...(history.snapshot.container && { container: history.snapshot.container }),

          ...(history.snapshot.outgoing && { outgoing: history.snapshot.outgoing }),
          ...(history.snapshot.forwarded && { forwarded: history.snapshot.forwarded }),

          ...(history.expectation && {
            expectation: {
              id: history.expectation.id,
              ...(history.expectation.schema.forward && { forward: history.expectation.schema.forward }),
            },
          }),
        };

        const json = new JsonFormatHighlight(formatted, 2, {
          theme: 'custom',
          afterCopyHandler: () => context.shared.popups.push('Copied!', { icon: 'fas fa-clone', level: 'info' }),
        });

        pre.appendChild(json.render());
      }

      pre.classList.toggle('hidden');
    });
  }

  static build(history: History['TPlain']) {
    return new HistoryComponent(history);
  }
}
