import _set from 'lodash/set';

import { convertObjectToKeyValueCouples } from '../utils';
import { Form } from './form';

export class DynamicStorage {
  public form = Form.build(this.element);

  constructor(public key: string, public element: Element) {}

  public sync() {
    const stored: [string, unknown][] = JSON.parse(localStorage.getItem(this.key) ?? '[]');
    this.form.assign(stored.reduce((acc, [path, value]) => _set(acc, path, value), {}));

    return this;
  }

  public save() {
    localStorage.setItem(this.key, JSON.stringify(convertObjectToKeyValueCouples(this.form.values)));
    return this;
  }

  public clear() {
    localStorage.removeItem(this.key);
    return this;
  }

  static build(key: string, element: Element) {
    return new DynamicStorage(key, element);
  }
}
