import EventEmitter from 'events';
import { TFunction } from '../../../../types';

interface IEvents {
  'register': [string];
}

export class GroupsService {
  public storage = new Set<string>();
  private events = new EventEmitter();

  public register(group: string): this {
    if (!this.storage.has(group)) {
      this.storage.add(group);
      this.emit('register', group);
    }

    return this;
  }

  public clear(): this {
    this.storage.clear();
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

  static build(): GroupsService {
    return new GroupsService();
  }
}
