import _set from 'lodash/set';

import { convertObjectToKeyValueCouples } from '../utils';
import { ClientStorage } from './client-storage';
import { Form } from './form';

export class DynamicStorage<T extends object = object> {
  public form = Form.build<T>(this.element);
  public client = ClientStorage.build<[string, unknown][]>(this.key);

  constructor(public key: string, public element: Element) {}

  public sync(): this {
    const stored: [string, unknown][] = this.client.extract() ?? [];
    this.form.assign(stored.reduce((acc, [path, value]) => _set(acc, path, value), {}));

    return this;
  }

  public save(): this {
    this.client.store(convertObjectToKeyValueCouples(this.form.extract(), this.form.paths));
    return this;
  }

  public clear(): this {
    this.client.clear();
    return this;
  }

  static build<T extends object>(key: string, element: Element) {
    return new DynamicStorage<T>(key, element);
  }
}
