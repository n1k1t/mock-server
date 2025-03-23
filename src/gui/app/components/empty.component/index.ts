import hbs from 'handlebars';
import { Component } from '../../models';

const template = hbs.compile(require('./template.hbs'));

export class EmptyComponent extends Component {
  static build() {
    return new EmptyComponent(template({}));
  }
}
