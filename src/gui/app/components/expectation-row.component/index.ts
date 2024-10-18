import JsonFormatHighlight from '../../../../../../json-formatter';
import hbs from 'handlebars';
import _pick from 'lodash/pick';

import type { getExpectationsList } from '../../../../server/endpoints';
import { popupsContainerComponent } from '../popups-container.component';
import { Component } from '../../models';

import context from '../../context';

const template = require('./template.hbs');
const render = hbs.compile(template);

export class ExpectationRowComponent extends Component {
  public buildElement(expectation: typeof getExpectationsList['TResponse']['data'][0]): Element {
    const jsonComponent = new JsonFormatHighlight(
      _pick(expectation, ['id', 'type', 'destroy', 'delay', 'request', 'response', 'forward']),
      1,
      {
        theme: 'custom',
        afterCopyHandler: () => popupsContainerComponent.push('Copied', { icon: 'fas fa-clone', level: 'info' }),
      }
    );

    const element = Object.assign(this.compileHtmlStringToElement(render(expectation)), { id: expectation.id });

    element.querySelector('pre')?.appendChild(jsonComponent.render());
    element.querySelector('button.activity')?.addEventListener('click', () =>
      context.webSocket.exec('expectations:update', { id: expectation.id, set: { isEnabled: !expectation.isEnabled } })
    );

    return element;
  }
}

export const expectationRowComponent = new ExpectationRowComponent();
