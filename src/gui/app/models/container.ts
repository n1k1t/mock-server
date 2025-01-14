import EventEmitter from 'events';
import { DynamicStorage } from './dynamic-storage';
import { Component } from './component';
import { TFunction } from '../../../types';

interface IContainerEvents {
  initialize: [Container];
  refresh: [Container];
  select: [Container];
}

export class Container extends Component {
  public storage = DynamicStorage.build(`config:${this.element.id}`, this.element.querySelector('div#config')!);
  public events = new EventEmitter();

  constructor(public element: Element) {
    super();
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

  public on<K extends keyof IContainerEvents>(event: K, handler: TFunction<unknown, IContainerEvents[K]>) {
    this.events.on(event, handler);
    return this;
  }

  public once<K extends keyof IContainerEvents>(event: K, handler: TFunction<unknown, IContainerEvents[K]>) {
    this.events.once(event, handler);
    return this;
  }

  private emit<K extends keyof IContainerEvents>(event: K, ...args: IContainerEvents[K]) {
    this.events.emit(event, ...args);
    return this;
  }

  static build(element: Element) {
    return new Container(element);
  }
}
