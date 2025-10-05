import hbs from 'handlebars';

import type { History } from '../../../../../../server';

import { TSettingsVisualPathSize } from '../../../../types';
import { ViewerComponent } from '../../../../components/viewer.component';
import { Component } from '../../../../models';

import context from '../../../../context';

const template = hbs.compile(require('./template.hbs'));

export class HistoryComponent extends Component {
  public TOptions!: {
    pathSize?: TSettingsVisualPathSize;
  };

  public viewer = ViewerComponent.build({ depth: 2 }).hide();

  constructor(
    public data: History['TPlain'] | History['TCompact'],
    public options?: HistoryComponent['TOptions']
  ) {
    super();
    this.refresh(options);
  }

  /** Provides data into component */
  public provide(data: History['TPlain']) {
    return Object.assign(this, { data });
  }

  public assign(payload: Partial<Pick<HistoryComponent, 'options'>>): this {
    return Object.assign(this, payload);
  }

  /** Refreshes viewer and meta of component */
  public refresh(options: HistoryComponent['TOptions'] | undefined = this.options): this {
    this
      .assign({ options })
      .replace(template({ options, data: this.data }))
      .append(this.viewer);

    if (this.data.format === 'plain') {
      this.viewer.provide({
        event: this.data.snapshot.event,
        transport: this.data.snapshot.transport,

        ...(this.data.snapshot.seed && { seed: this.data.snapshot.seed }),
        ...(this.data.snapshot.container && { container: this.data.snapshot.container }),

        ...(Object.keys(this.data.snapshot.flags).length && { flags: this.data.snapshot.flags }),
        ...(Object.keys(this.data.snapshot.state).length && { state: this.data.snapshot.state }),

        ...(this.data.expectation && {
          expectation: {
            id: this.data.expectation.id,
            group: this.data.expectation.group,

            ...(this.data.expectation.schema.forward && { forward: this.data.expectation.schema.forward }),
          },
        }),

        ...((this.data.snapshot.cache.hasRead || this.data.snapshot.cache.hasWritten) && {
          cache: this.data.snapshot.cache,
        }),

        incoming: this.data.snapshot.incoming,

        ...(this.data.snapshot.error && { error: this.data.snapshot.error }),
        ...(this.data.status === 'completed' && { outgoing: this.data.snapshot.outgoing }),
        ...(this.data.snapshot.forwarded && { forwarded: this.data.snapshot.forwarded }),
        ...(this.data.snapshot.messages?.length && { messages: this.data.snapshot.messages }),
      });
    }

    this.element.querySelector('div.meta')!.addEventListener('click', (event) =>
      event.composedPath().some((element) => (<Element>element)?.classList?.contains('meta'))
        ? this.viewer.isHidden ? this.expand() : this.viewer.hide()
        : null
    );

    return this;
  }

  public match(query: string): boolean {
    return [
      this.data.group,
      this.data.expectation?.name,
      this.data.meta.tags.incoming.path,
      this.data.meta.tags.incoming.method,
      this.data.meta.tags.error?.code,
      this.data.meta.tags.error?.message,
      String(this.data.meta.tags.outgoing?.status ?? ''),
      String(this.data.meta.tags.seed ?? ''),
    ].some((value) => value?.includes(query));
  }

  private async expand(): Promise<void> {
    if (this.data.format === 'compact') {
      const response = await context.services.io
        .exec('history:get-by-id', { id: this.data.id })
        .catch((error) => console.error(error));

      this.data = response?.data ?? this.data;
      this.refresh();
    }

    this.viewer.show();
  }

  static build(data: HistoryComponent['data'], options?: HistoryComponent['TOptions']) {
    return new HistoryComponent(data, options);
  }
}
