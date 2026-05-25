import hbs from 'handlebars';
import _ from 'lodash';

import type { TSettingsVisualPathSize } from '../../../../types';
import type { Expectation } from '../../../../../../expectations';

import { EditorComponent, ViewerComponent } from '../../../../components';
import { Button, Component } from '../../../../models';
import { cast } from '../../../../../../utils';

import context from '../../../../context';

const templates = {
  expectation: hbs.compile(require('./templates/expectation.hbs')),
  editor: hbs.compile(require('./templates/editor.hbs')),
};

export class ExpectationComponent extends Component {
  public TOptions!: {
    pathSize?: TSettingsVisualPathSize;
  };

  public viewer = ViewerComponent.build({ depth: 3 }).hide();

  public editor = (() => {
    const model = EditorComponent.build<Pick<Expectation['configuration'], 'defaults'>>();
    const view = new Component(
      templates.editor({
        data: this.data,
        options: cast<ExpectationComponent['TOptions']>({ pathSize: 'M' }),
      })
    );

    view.element.querySelector('div.content')?.append(model.element);
    return { model, view };
  })();

  constructor(
    public data: Expectation['TPlain'] | Expectation['TCompact'],
    public options?: ExpectationComponent['TOptions']
  ) {
    super();
    this.refresh(options);

    Button
      .build(this.editor.view.element.querySelector('button#save'))
      .handle(async () => {
        await context.services.io.exec('expectations:update', {
          id: this.data.id,
          set: { defaults: this.editor.model.extract()?.defaults ?? {} },
        });

        context.shared.popups.push('Saved');
      });
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
      .replace(templates.expectation({ options, data: this.data }))
      .append(this.viewer);

    this.viewer.provide(_.pick(this.data, ['id', 'type', 'transports', 'defaults', 'schema']));

    Button
      .build(this.element.querySelector('button#activity'))
      .handle(() => context.services.io.exec('expectations:update', {
        id: this.data.id,
        set: { isEnabled: !this.data.isEnabled },
      }));

    Button
      .build(this.element.querySelector('button#edit'))
      .handle(async () => {
        if (this.data.format === 'compact') {
          await this.fetch();
        }

        this.editor.model.provide({ defaults: this.data.defaults ?? { state: {} } });
        context.shared.curtain.clear().append(this.editor.view).show();
      });

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

  private async fetch(): Promise<void> {
    const response = await context.services.io
      .exec('expectations:get-by-id', { id: this.data.id })
      .catch((error) => console.error(error));

    this.data = response?.data ?? this.data;
  }

  private async expand(): Promise<void> {
    if (this.data.format === 'compact') {
      await this.fetch();
      this.refresh();
    }

    this.viewer.show();
  }

  static build(data: ExpectationComponent['data'], options?: ExpectationComponent['TOptions']): ExpectationComponent {
    return new ExpectationComponent(data, options);
  }
}
