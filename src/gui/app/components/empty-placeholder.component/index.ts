import hbs from 'handlebars';
import { Component } from '../../models';

const template = require('./template.hbs');
const render = hbs.compile(template);

export class EmptyPlaceholderComponent extends Component {
  public buildElement(): Element {
    return this.compileHtmlStringToElement(render({}));
  }
}

export const emptyPlaceholderComponent = new EmptyPlaceholderComponent();
