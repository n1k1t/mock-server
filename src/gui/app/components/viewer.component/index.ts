import JsonFormatter from '../../../../../../../packages/json-formatter';
import hbs from 'handlebars';

import { Component } from '../../models';
import context from '../../context';

const template = hbs.compile(require('./template.hbs'));

export class ViewerComponent extends Component {
  public instance = new JsonFormatter({}, this.options?.depth ?? 3, {
    theme: 'custom',
    afterCopyHandler: () => context.shared.popups.push('Copied!'),
  });

  constructor(public options?: { depth?: number }) {
    super(template({}));
    this.provide({});
  }

  public provide(payload: object | null): this {
    this.instance.json = payload;
    return this.clear().append(this.instance.render());
  }

  static build(options?: ViewerComponent['options']) {
    return new ViewerComponent(options);
  }
}
