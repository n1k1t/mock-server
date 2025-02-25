
import _set from 'lodash/set';

import { convertObjectToKeyValueCouples } from '../utils';
import { PartialDeep } from '../../../types';
import { Component } from './component';

type TInputType = 'text' | 'number' | 'password' | 'checkbox';

const castInputValue = (() => {
  const map = {
    password: String,
    number: Number,
    text: String,
  };

  return (type: TInputType, value: string): null | string | number => {
    if (type === 'checkbox') {
      return value || null;
    }

    const trimed = value.trim();
    return trimed.length ? (map[type] ?? String)(trimed) : null;
  };
})();

export class Form<T extends object = object> extends Component {
  public get paths(): string[] {
    return <string[]>[...this.element.querySelectorAll('*[data-key]')]
      .map((input) => input.getAttribute('data-key'))
      .filter(Boolean);
  }

  public extract(): PartialDeep<T> {
    return [...this.element.querySelectorAll('*[data-key]')].reduce((acc, input) => {
      const key = input.getAttribute('data-key');
      const type = <TInputType>(input.getAttribute('cast') ?? input.getAttribute('type') ?? 'text');

      if (!key || 'value' in input === false || typeof input.value !== 'string') {
        return acc;
      }

      if (input.hasAttribute('list')) {
        const delimiter = input.getAttribute('list') ?? ',';
        const value = input.value
          .split(delimiter)
          .map((nested) => castInputValue(type, nested))
          .filter((nested) => nested !== null);

        return value.length ? _set(acc, key, value) : acc;
      }

      const value = castInputValue(type, input.value);

      if (type === 'checkbox' && 'checked' in input) {
        return input.checked ? _set(acc, key, value ?? true) : acc;
      }

      return value !== null ? _set(acc, key, value) : acc;
    }, <T>{});
  }

  public assign(payload: PartialDeep<T>) {
    convertObjectToKeyValueCouples(payload, this.paths)
      .map(([path, value]) => <const>[path, value, this.element.querySelector(`*[data-key="${path}"]`)!])
      .forEach(([path, value, input]) =>
        _set(input, 'value', Array.isArray(value) ? value.join(input.getAttribute('list') ?? ',') : (value ?? ''))
      );

    return this;
  }

  static build<T extends object>(element: Element) {
    return new Form<T>(element);
  }
}
