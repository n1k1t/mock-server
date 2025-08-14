import EventEmitter from 'events';

import { TSettingsVisualPathSize } from '../types';
import { ClientStorage } from '../models';
import { TFunction } from '../../../../types';
import { cast } from '../../../utils';

type TEvents = {
  [K in keyof SettingsService['storage'] as `assign:${K}`]: [SettingsService['storage'][K]];
}

export class SettingsService {
  public storage = {
    'settings:visual:path-size': cast<TSettingsVisualPathSize>('M'),
  };

  private events = new EventEmitter();
  private memory = ClientStorage.build<SettingsService['storage']>('services:settings');

  constructor() {
    Object.assign(this.storage, this.memory.extract() ?? {});
  }

  public assign<K extends keyof SettingsService['storage']>(key: K, value: SettingsService['storage'][K]): this {
    this.storage[key] = value;
    this.memory.store(this.storage);

    return this.emit(`assign:${key}`, value);
  }

  public get<K extends keyof SettingsService['storage']>(key: K): SettingsService['storage'][K] {
    return this.storage[key];
  }

  public on<K extends keyof TEvents>(event: K, handler: TFunction<unknown, TEvents[K]>) {
    this.events.on(event, handler);
    return this;
  }

  public once<K extends keyof TEvents>(event: K, handler: TFunction<unknown, TEvents[K]>) {
    this.events.once(event, handler);
    return this;
  }

  private emit<K extends keyof TEvents>(event: K, ...args: TEvents[K]) {
    this.events.emit(event, ...args);
    return this;
  }

  static build(): SettingsService {
    return new SettingsService();
  }
}
