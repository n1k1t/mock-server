import JsonFormatHighlight from '../../../../../../json-formatter';
import hbs from 'handlebars';
import _pick from 'lodash/pick';

import type { Expectation } from '../../../../expectations';
import { Component } from '../../models';

import context from '../../context';

const template = require('./template.hbs');
const render = hbs.compile(template);

export class ExpectationComponent extends Component {
  public isExpanded: boolean = false;

  constructor(public data: Expectation['TPlain']) {
    super();
    this.refresh(data);
  }

  public refresh(data: Expectation['TPlain']) {
    this.clear().append(render(data));

    const pre = this.element.querySelector('pre')!;
    const json = new JsonFormatHighlight(_pick(data, ['id', 'type', 'transports', 'schema']), 3, {
      theme: 'custom',
      afterCopyHandler: () => context.shared.popups.push('Copied', { icon: 'fas fa-clone', level: 'info' }),
    });

    pre.appendChild(json.render());

    if (this.isExpanded) {
      pre.classList.remove('hidden');
    }

    this.element.querySelector('button.activity')?.addEventListener('click', () =>
      context.services.io.exec('expectations:update', { id: data.id, set: { isEnabled: !data.isEnabled } })
    );

    this.element.querySelector('div.meta')!.addEventListener('click', (event) => {
      if ((<Element>event.target).nodeName === 'BUTTON') {
        return null;
      }
      if (event.composedPath().some((element) => (<Element>element)?.classList?.contains('meta')) === false) {
        return null;
      }

      pre.classList.toggle('hidden');
      this.isExpanded = !this.isExpanded;
    });

    return Object.assign(this, { expectation: data });
  }

  public match(query: string): boolean {
    return [
      this.data.group,
      this.data.name,
      this.data.schema.forward?.baseUrl,
      this.data.schema.forward?.url,
      this.data.meta.tags.map(({ value }) => value).join(),
    ].some((value) => value?.includes(query));
  }

  static build(expectation: Expectation['TPlain']) {
    return new ExpectationComponent(expectation);
  }
}
