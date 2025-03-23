import { EventEmitter } from 'events';
import _debouce from 'lodash/debounce';
import hbs from 'handlebars';

import { Component } from '../../models';
import { TFunction } from '../../../../types';

interface IEvents {
  input: [string];
  clear: [];
}

const template = hbs.compile(require('./template.hbs'));

export class SearchComponent extends Component {
  private events = new EventEmitter();

  private input = this.element.querySelector('input')!;
  private button = this.element.querySelector('button')!;

  constructor(public options?: { title?: string }) {
    super(template({ title: options?.title ?? 'Type something' }));

    this.button.classList.add('hidden');
    this.button.addEventListener('click', () => this.clear());

    this.on('input', () => {
      this.button.classList.remove('hidden');
      this.element.classList.add('filled');
    });

    this.on('clear', () => {
      this.button.classList.add('hidden');
      this.element.classList.remove('filled');
    });

    this.input.addEventListener('keydown', _debouce(
      () => this.input.value ? this.emit('input', this.input.value) : this.clear(),
      350
    ));
  }

  public clear(): this {
    this.input.value = '';
    return this.emit('clear');
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

  static build(options?: SearchComponent['options']) {
    return new SearchComponent(options);
  }
}
