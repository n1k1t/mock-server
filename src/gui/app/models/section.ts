import EventEmitter from 'events';

import { Component, TElementPredicate } from './component';
import { DynamicStorage } from './dynamic-storage';
import { TFunction } from '../../../../types';
import { Button } from './button';

interface IEvents {
  initialize: [Section];
  compile: [Section];
  refresh: [Section];
  select: [Section];
}

export class Section extends Component {
  public content = new Component(this.element.querySelector('div.content'));

  public isInitialized = false;
  public isCompiled = false;

  public controls = {
    main: new Component(this.element.querySelector('div.controls div.main')),
    additional: new Component(this.element.querySelector('div.controls div.additional')),
  };

  public storage = DynamicStorage.build(`config:${this.element.id}`, this.element.querySelector('div.storage'));
  public meta: { name?: string, icon?: string } = {};

  private events = new EventEmitter();
  private expander = this.element.querySelector('div.controls button#expand');

  constructor(predicate: TElementPredicate) {
    super(predicate);

    if (this.expander) {
      Button.build(this.expander).handle(() => {
        if (this.controls.additional.isHidden) {
          this.controls.additional.show();
          return this.expander!.classList.add('toggled');
        }

        this.controls.additional.hide();
        return this.expander!.classList.remove('toggled');
      });
    }
  }

  public assignMeta(meta: Section['meta']): this {
    return Object.assign(this, { meta });
  }

  public compile(): this {
    if (this.isCompiled) {
      return this;
    }

    this.isCompiled = true;
    return this.emit('compile', this);
  }

  public initialize(): this {
    this.isInitialized = true;
    this.storage.sync();

    return this.emit('initialize', this);
  }

  public refresh(): this {
    return this.emit('refresh', this);
  }

  public select(): this {
    return this.emit('select', this);
  }

  public on<K extends keyof IEvents>(event: K, handler: TFunction<unknown, IEvents[K]>): this {
    this.events.on(event, handler);
    return this;
  }

  public once<K extends keyof IEvents>(event: K, handler: TFunction<unknown, IEvents[K]>): this {
    this.events.once(event, handler);
    return this;
  }

  private emit<K extends keyof IEvents>(event: K, ...args: IEvents[K]): this {
    this.events.emit(event, ...args);
    return this;
  }

  static build(predicate: TElementPredicate): Section {
    return new Section(predicate);
  }
}
