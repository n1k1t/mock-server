import JsonFormatHighlight from '../../../../../../json-formatter';
import hbs from 'handlebars';
import _pick from 'lodash/pick';

import type { Expectation } from '../../../../expectations';
import { Component } from '../../models';

import context from '../../context';

const template = require('./template.hbs');
const render = hbs.compile(template);

export class ExpectationComponent extends Component {
  constructor(public expectation: Expectation['TPlain']) {
    super();
    this.refresh(expectation);
  }

  public refresh(expectation: Expectation['TPlain']) {
    this.clear().append(render(expectation));

    const json = new JsonFormatHighlight(_pick(expectation, ['id', 'type', 'schema']), 2, {
      theme: 'custom',
      afterCopyHandler: () => context.shared.popups.push('Copied', { icon: 'fas fa-clone', level: 'info' }),
    });

    this.element.querySelector('pre')?.appendChild(json.render());
    this.element.querySelector('button.activity')?.addEventListener('click', () =>
      context.services.ws.exec('expectations:update', { id: expectation.id, set: { isEnabled: !expectation.isEnabled } })
    );

    return Object.assign(this, { expectation });
  }

  static build(expectation: Expectation['TPlain']) {
    return new ExpectationComponent(expectation);
  }
}
