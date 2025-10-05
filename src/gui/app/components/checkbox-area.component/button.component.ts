import EventEmitter from 'events';

import { calculateColor } from '../../utils';
import { Component } from '../../models';
import { TFunction } from '../../../../../types';

type TTrigger = 'click' | 'auto' | 'silent';

interface IEvents<TName extends string = string> {
  enable: [CheckboxAreaButtonComponent<TName>, TTrigger];
  disable: [CheckboxAreaButtonComponent<TName>, TTrigger];
}

export class CheckboxAreaButtonComponent<TName extends string = string> extends Component {
  private events = new EventEmitter();

  constructor(public configuration: {
    name: TName;

    isEnabled?: boolean;
    colorify?: boolean | { prefix: string };
  }) {
    const color = configuration.colorify
      ? typeof configuration.colorify === 'object'
        ? calculateColor(configuration.name, configuration.colorify.prefix)
        : calculateColor(configuration.name)
      : null;

    super(`
      <button style="${color ? `color: ${color}` : ''}" class="${configuration.isEnabled ? 'checked' : ''}">
        ${configuration.name}
      </button>
    `);

    this.element.addEventListener('click', () => this.isEnabled ? this.disable('click') : this.enable('click'));
  }

  public get name(): TName {
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
    configuration: CheckboxAreaButtonComponent<TName>['configuration']
  ): CheckboxAreaButtonComponent<TName> {
    return new CheckboxAreaButtonComponent(configuration);
  }
}
