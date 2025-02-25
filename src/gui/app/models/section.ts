import EventEmitter from 'events';

import { DynamicStorage } from './dynamic-storage';
import { TFunction } from '../../../types';
import { Component } from './component';

interface IEvents {
  initialize: [Section];
  refresh: [Section];
  select: [Section];
}

export class Section extends Component {
  public storage = DynamicStorage.build(`config:${this.element.id}`, this.element.querySelector('div.storage')!);
  public content = new Component(this.element.querySelector('div.content')!);

  public events = new EventEmitter();
  public meta: {
    name?: string;
    icon?: string;
  } = {};

  constructor(public element: Element) {
    super();
  }

  public assignMeta(meta: Section['meta']) {
    return Object.assign(this, { meta });
  }

  public initialize() {
    this.storage.sync();
    return this.emit('initialize', this);
  }

  public refresh() {
    return this.emit('refresh', this);
  }

  public select() {
    return this.emit('select', this);
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

  static build(predicate: Element | string) {
    return new Section(typeof predicate === 'string' ? new Component(predicate).element : predicate);
  }
}
