import hbs from 'handlebars';
import { Component } from '../../models';

export interface IPopupPushOptions {
  level?: 'info' | 'warning' | 'error';
}

const template = hbs.compile(require('./template.hbs'));

export class PopupsComponent extends Component {
  constructor() {
    super();
    this.element.classList.add('popups');
  }

  public push(message: string, options: IPopupPushOptions = {}) {
    const popup = this.compileHtmlStringToElement(template({ message, level: options.level ?? 'info' }));

    this.element.prepend(popup);
    setTimeout(() => popup.remove(), 3000);
  }

  static build() {
    return new PopupsComponent();
  }
}
