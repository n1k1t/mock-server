import hbs from 'handlebars';
import { Component } from '../../models';

export interface IPopupComponentOptions {
  icon?: string;
  level?: 'info' | 'warn' | 'error';
}

const template = require('./template.hbs');
const render = hbs.compile(template);

export class PopupComponent extends Component {
  public buildElement(message: string, options: IPopupComponentOptions = {}): Element {
    return this.compileHtmlStringToElement(render({ message, ...options }));
  }
}

export const popupComponent = new PopupComponent();
