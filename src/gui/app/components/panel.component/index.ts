import hbs from 'handlebars';
import { Component, TElementPredicate } from '../../models';

export type TPanelSize = 'XS' | 'S' | 'M' | 'L' | 'XL';

export interface IPanelConfiguration {
  title?: {
    text: string;

    description?: string;
    icon?: string;
  };

  height?: TPanelSize;
  width?: TPanelSize;

  class?: string;
}

const template = hbs.compile(require('./template.hbs'));

export class PanelComponent extends Component {
  private content = new Component(this.element.querySelector('div.content'));

  constructor(provided: IPanelConfiguration = {}) {
    super(template(provided));
  }

  public clear(): this {
    this.content.clear();
    return this;
  }

  public append(predicate: TElementPredicate): this {
    this.content.append(predicate);
    return this;
  }

  public prepend(predicate: TElementPredicate): this {
    this.content.prepend(predicate);
    return this;
  }

  public replace(predicate: TElementPredicate): this {
    this.content.replace(predicate);
    return this;
  }

  static build(configuration?: IPanelConfiguration) {
    return new PanelComponent(configuration);
  }
}
