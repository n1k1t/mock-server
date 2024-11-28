import hbs from 'handlebars';
import { Component } from '../../models';

const template = require('./template.hbs');
const render = hbs.compile(template);

export class EmptyComponent extends Component {
  static build() {
    return new EmptyComponent(render({}));
  }
}
