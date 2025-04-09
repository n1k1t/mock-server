import EventEmitter from 'events';
import hbs from 'handlebars';

import { IPanelConfiguration, PanelComponent } from '../panel.component';
import { CheckboxAreaButtonComponent } from './item.component';
import { TFunction } from '../../../../types';
import { Component } from '../../models';
import { cast } from '../../../../utils';

interface IEvents {
  enable: [CheckboxAreaButtonComponent];
  disable: [CheckboxAreaButtonComponent];
}

const template = hbs.compile(require('./template.hbs'));

export class CheckboxAreaComponent extends Component {
  public buttons = {
    all: CheckboxAreaButtonComponent.build({ name: 'ALL', isEnabled: true }),
    provided: cast<Record<string, CheckboxAreaButtonComponent>>({}),
  };

  private events = new EventEmitter();

  private panel = new PanelComponent({ ...this.provided, class: 'checkbox-area' }).append(template(this.provided));
  private area = new Component(this.panel.element.querySelector('div.buttons')).append(this.buttons.all);

  constructor(private provided: IPanelConfiguration) {
    super();
    this.replace(this.panel);

    this.buttons.all.on('enable', (button, trigger) =>
      trigger === 'click' ? this.extract().forEach((button) => button.enable()) : null
    );

    this.buttons.all.on('disable', (button, trigger) =>
      trigger === 'click' ? this.extract().forEach((button) => button.disable()) : null
    );
  }

  public extract(): CheckboxAreaButtonComponent[] {
    return Object.values(this.buttons.provided);
  }

  public provide(...provided: (CheckboxAreaButtonComponent | CheckboxAreaButtonComponent['configuration'])[]): this {
    provided.forEach((predicate) => {
      const button = predicate instanceof CheckboxAreaButtonComponent
        ? predicate
        : CheckboxAreaButtonComponent.build(predicate);

      this.buttons.provided[button.name] = button;
      this.area.append(button);

      button.on('enable', (button, trigger) => {
        if (this.extract().every((nested) => nested.isEnabled)) {
          this.buttons.all.enable();
        }
        if (trigger !== 'silent') {
          this.emit('enable', button);
        }
      });

      button.on('disable', (button, trigger) => {
        if (this.extract().some((nested) => !nested.isEnabled)) {
          this.buttons.all.disable();
        }
        if (trigger !== 'silent') {
          this.emit('disable', button);
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

  public on<K extends keyof IEvents>(event: K, handler: TFunction<unknown, IEvents[K]>) {
    this.events.on(event, handler);
    return this;
  }

  public once<K extends keyof IEvents>(event: K, handler: TFunction<unknown, IEvents[K]>) {
    this.events.once(event, handler);
    return this;
  }

  private emit<K extends keyof IEvents>(event: K, ...args: IEvents[K]) {
    this.events.emit(event, ...args);
    return this;
  }

  static build(provided: CheckboxAreaComponent['provided']) {
    return new CheckboxAreaComponent(provided);
  }
}
