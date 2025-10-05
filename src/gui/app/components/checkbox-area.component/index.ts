import EventEmitter from 'events';
import hbs from 'handlebars';

import { IPanelConfiguration, PanelComponent } from '../panel.component';
import { CheckboxAreaButtonComponent } from './button.component';
import { ClientStorage, Component } from '../../models';
import { TFunction } from '../../../../../types';
import { cast } from '../../../../utils';

interface IEvents<TName extends string = string> {
  enable: [CheckboxAreaButtonComponent<TName>];
  disable: [CheckboxAreaButtonComponent<TName>];
  switch: [CheckboxAreaButtonComponent<TName>[]];
}

const template = hbs.compile(require('./template.hbs'));

export class CheckboxAreaComponent<TName extends string = string> extends Component {
  public buttons = {
    all: CheckboxAreaButtonComponent.build({ name: 'ALL', isEnabled: true }),
    provided: cast<Record<string, CheckboxAreaButtonComponent<TName>>>({}),
  };

  private panel = new PanelComponent({
    ...this.configuration,
    class: `checkbox-area ${this.configuration.class ?? ''}`
  }).append(template(this.configuration));

  private area = new Component(this.panel.element.querySelector('div.buttons')).append(this.buttons.all);

  private events = new EventEmitter();
  private storage: ClientStorage<{ enabled: string[] }> | null = this.configuration.storage?.key
    ? ClientStorage.build(this.configuration.storage.key)
    : null;

  constructor(private configuration: IPanelConfiguration & {
    type?: 'radio';

    storage?: {
      key: string;
    };
  }) {
    super();
    this.replace(this.panel);

    if (this.configuration.type === 'radio') {
      this.buttons.all.hide();
    }

    this.buttons.all.on('enable', (button, trigger) =>
      trigger === 'click' ? this.extract().forEach((button) => button.enable()) : null
    );

    this.buttons.all.on('disable', (button, trigger) =>
      trigger === 'click' ? this.extract().forEach((button) => button.disable()) : null
    );
  }

  public extract(): CheckboxAreaButtonComponent<TName>[] {
    return Object.values(this.buttons.provided);
  }

  public provide(
    ...provided: (CheckboxAreaButtonComponent<TName> | CheckboxAreaButtonComponent<TName>['configuration'])[]
  ): this {
    const stored = this.storage?.extract();

    provided.forEach((predicate) => {
      const button = predicate instanceof CheckboxAreaButtonComponent
        ? predicate
        : CheckboxAreaButtonComponent.build(predicate);

      this.buttons.provided[button.name] = button;
      this.area.append(button);

      if (stored) {
        stored.enabled.includes(button.name)
          ? button.enable('silent')
          : button.disable('silent');
      }

      if (!button.isEnabled) {
        this.buttons.all.disable();
      }

      button.on('enable', (button, trigger) => {
        const buttons = this.extract();

        this.storage?.store({
          enabled: buttons.filter((nested) => nested.isEnabled).map((nested) => nested.name),
        });

        if (this.configuration.type === 'radio' && trigger === 'click') {
          buttons.forEach((nested) => nested.disable('silent'));
          button.enable('silent');
        }

        if (buttons.every((nested) => nested.isEnabled)) {
          this.buttons.all.enable();
        }
        if (trigger !== 'silent') {
          this.emit('enable', button);
          this.emit('switch', buttons);
        }
      });

      button.on('disable', (button, trigger) => {
        const buttons = this.extract();

        this.storage?.store({
          enabled: buttons.filter((nested) => nested.isEnabled).map((nested) => nested.name),
        });

        if (this.configuration.type === 'radio' && trigger === 'click') {
          return button.enable('silent');
        }
        if (buttons.some((nested) => !nested.isEnabled)) {
          this.buttons.all.disable();
        }
        if (trigger !== 'silent') {
          this.emit('disable', button);
          this.emit('switch', buttons);
        }
      });
    });

    return this;
  }

  public clear(): this {
    this.extract().forEach((button) => button.delete());
    this.buttons.provided = {};

    return this;
  }

  /** Triggers `switch` event */
  public trigger(): this {
    return this.emit('switch', this.extract());
  }

  public on<K extends keyof IEvents>(event: K, handler: TFunction<unknown, IEvents<TName>[K]>) {
    this.events.on(event, handler);
    return this;
  }

  public once<K extends keyof IEvents>(event: K, handler: TFunction<unknown, IEvents<TName>[K]>) {
    this.events.once(event, handler);
    return this;
  }

  private emit<K extends keyof IEvents>(event: K, ...args: IEvents<TName>[K]) {
    this.events.emit(event, ...args);
    return this;
  }

  static build<TName extends string>(
    provided: CheckboxAreaComponent<TName>['configuration']
  ): CheckboxAreaComponent<TName> {
    return new CheckboxAreaComponent(provided);
  }
}
