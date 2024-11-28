import hbs from 'handlebars';
import { Component } from '../../models';

export interface IPopupPushOptions {
  icon?: string;
  level?: 'info' | 'warn' | 'error';
}

const template = require('./template.hbs');
const render = hbs.compile(template);

export class PopupsComponent extends Component {
  constructor() {
    super();
    this.element.classList.add('popups');
  }

  public push(message: string, options: IPopupPushOptions = {}) {
    const popup = this.compileHtmlStringToElement(render({ message, ...options }));

    this.element.prepend(popup);
    setTimeout(() => popup.remove(), 1000);
  }

  static build() {
    return new PopupsComponent();
  }
}
