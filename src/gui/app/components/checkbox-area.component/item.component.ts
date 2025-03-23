import EventEmitter from 'events';

import { calculateColor } from '../../utils';
import { Component } from '../../models';
import { TFunction } from '../../../../types';

type TTrigger = 'click' | 'auto' | 'silent';

interface IEvents {
  enable: [CheckboxAreaButtonComponent, TTrigger];
  disable: [CheckboxAreaButtonComponent, TTrigger];
}

export class CheckboxAreaButtonComponent extends Component {
  private events = new EventEmitter();

  constructor(public configuration: { name: string, isEnabled?: boolean, colorify?: boolean }) {
    super(`
      <button
        style="${configuration?.colorify ? `color: ${calculateColor(configuration.name)}` : ''}"
        class="${configuration.isEnabled ? 'checked' : ''}"
      >${configuration.name}</button>
    `);

    this.element.addEventListener('click', () => this.isEnabled ? this.disable('click') : this.enable('click'));
  }

  public get name(): string {
    return this.configuration.name;
  }

  public get isEnabled(): boolean {
    return this.element.classList.contains('checked');
  }

  public enable(trigger: TTrigger = 'auto'): this {
    if (this.isEnabled) {
      return this;
    }

    this.element.classList.add('checked');
    return this.emit('enable', this, trigger);
  }

  public disable(trigger: TTrigger = 'auto'): this {
    if (!this.isEnabled) {
      return this;
    }

    this.element.classList.remove('checked');
    return this.emit('disable', this, trigger);
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

  static build(configuration: CheckboxAreaButtonComponent['configuration']) {
    return new CheckboxAreaButtonComponent(configuration);
  }
}
