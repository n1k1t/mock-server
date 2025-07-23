import _ from 'lodash';

import { convertObjectToKeyValueCouples } from '../utils';
import { Component, TElementPredicate } from './component';
import { ClientStorage } from './client-storage';
import { Form, FormFile } from './form';

export class DynamicStorage<T extends object = object> extends Component {
  public client = ClientStorage.build<[string, unknown][]>(this.key);
  public form = Form.build<T>(this.element);

  constructor(public key: string, predicate: TElementPredicate) {
    super(predicate);
  }

  public sync(): this {
    const stored: [string, unknown][] = this.client.extract() ?? [];
    this.form.assign(stored.reduce((acc, [path, value]) => _.set(acc, path, value), {}));

    return this;
  }

  public async save(): Promise<T> {
    const extracted = await this.form.extract();

    this.client.store(
      convertObjectToKeyValueCouples(extracted, this.form.paths).filter(
        ([, value]) => Array.isArray(value)
          ? !value.some((nested) => typeof nested === 'object' && nested instanceof FormFile)
          : !(typeof value === 'object' && value instanceof FormFile)
      )
    );

    return extracted;
  }

  public clear(): this {
    this.client.clear();
    return this;
  }

  static build<T extends object>(key: string, predicate: TElementPredicate) {
    return new DynamicStorage<T>(key, predicate);
  }
}
