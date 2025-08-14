import hbs from 'handlebars';
import { Component } from '../../models';

const template = hbs.compile(require('./template.hbs'));

export class SeparatorComponent extends Component {
  public highlight(): this {
    this.element.classList.add('highlighted');
    return this;
  }

  static build(title: string) {
    return new SeparatorComponent(template({ title }));
  }
}
