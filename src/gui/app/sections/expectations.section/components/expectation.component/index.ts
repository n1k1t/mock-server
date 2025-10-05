import hbs from 'handlebars';
import _ from 'lodash';

import type { TSettingsVisualPathSize } from '../../../../types';
import type { Expectation } from '../../../../../../expectations';

import { Button, Component } from '../../../../models';
import { ViewerComponent } from '../../../../components/viewer.component';

import context from '../../../../context';

const template = hbs.compile(require('./template.hbs'));

export class ExpectationComponent extends Component {
  public TOptions!: {
    pathSize?: TSettingsVisualPathSize;
  };

  public viewer = ViewerComponent.build({ depth: 3 }).hide();

  constructor(
    public data: Expectation['TPlain'] | Expectation['TCompact'],
    public options?: ExpectationComponent['TOptions']
  ) {
    super();
    this.refresh(options);
  }

  /** Provides data into component */
  public provide(data: Expectation['TPlain']): this {
    return Object.assign(this, { data });
  }

  public assign(payload: Partial<Pick<ExpectationComponent, 'options'>>): this {
    return Object.assign(this, payload);
  }

  /** Refreshes viewer and meta of component */
  public refresh(options: ExpectationComponent['TOptions'] | undefined = this.options): this {
    this
      .assign({ options })
      .replace(template({ options, data: this.data }))
      .append(this.viewer);

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
          ? this.viewer.isHidden ? this.expand() : this.viewer.hide()
          : null
        : null
    );

    return this;
  }

  public match(query: string): boolean {
    return [
      this.data.group,
      this.data.name,
      this.data.meta.tags.forward?.url,
      this.data.meta.tags.incoming?.path?.join(),
      this.data.meta.tags.incoming?.error?.join(),
      this.data.meta.tags.incoming?.method?.join(),
      this.data.meta.tags.outgoing?.status?.join(),
    ].some((value) => value?.includes(query));
  }

  private async expand(): Promise<void> {
    if (this.data.format === 'compact') {
      const response = await context.services.io
        .exec('expectations:get-by-id', { id: this.data.id })
        .catch((error) => console.error(error));

      this.data = response?.data ?? this.data;
      this.refresh();
    }

    this.viewer.show();
  }

  static build(data: ExpectationComponent['data'], options?: ExpectationComponent['TOptions']): ExpectationComponent {
    return new ExpectationComponent(data, options);
  }
}
