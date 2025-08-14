import hbs from 'handlebars';
import _ from 'lodash';

import type { TSettingsVisualPathSize } from '../../types';
import type { Expectation } from '../../../../expectations';

import { Button, Component } from '../../models';
import { ViewerComponent } from '../viewer.component';

import context from '../../context';

const template = hbs.compile(require('./template.hbs'));

export class ExpectationComponent extends Component {
  public TOptions!: {
    pathSize?: TSettingsVisualPathSize;
  };

  public viewer = ViewerComponent.build({ depth: 3 }).hide();

  constructor(public data: Expectation['TPlain'], options?: ExpectationComponent['TOptions']) {
    super();
    this.refresh(options);
  }

  public provide(data: Expectation['TPlain']): this {
    return Object.assign(this, { data });
  }

  public refresh(options?: ExpectationComponent['TOptions']): this {
    this.replace(template({ options, data: this.data })).append(this.viewer);
    this.viewer.provide(_.pick(this.data, ['id', 'type', 'transports', 'schema']));

    Button
      .build(this.element.querySelector('button.activity'))
      .handle(() => context.services.io.exec('expectations:update', {
        id: this.data.id,
        set: { isEnabled: !this.data.isEnabled },
      }));

    this.element.querySelector('div.meta')!.addEventListener('click', (event) =>
      event.composedPath().some((element) => (<Element>element)?.classList?.contains('meta'))
        ? (<Element>event.target).nodeName !== 'BUTTON'
          ? this.viewer.isHidden ? this.viewer.show() : this.viewer.hide()
          : null
        : null
    );

    return this;
  }

  public match(query: string): boolean {
    return [
      this.data.group,
      this.data.name,
      this.data.schema.forward?.baseUrl,
      this.data.schema.forward?.url,
      this.data.meta.tags.map(({ value }) => value).join(),
    ].some((value) => value?.includes(query));
  }

  static build(data: Expectation['TPlain'], options?: ExpectationComponent['TOptions']): ExpectationComponent {
    return new ExpectationComponent(data, options);
  }
}
