
import _set from 'lodash/set';

import { convertObjectToKeyValueCouples } from '../utils';
import { Component } from './component';

type TInputType = 'text' | 'number' | 'password' | 'checkbox';

const castInputValue = (() => {
  const map = {
    password: String,
    text: String,
    number: Number,
  };

  return (type: TInputType, value: string): null | string | number => {
    if (type === 'checkbox') {
      return value || null;
    }

    const trimed = value.trim();
    return trimed.length ? (map[type] ?? String)(trimed) : null;
  };
})();

export class Form extends Component {
  public get values() {
    return [...this.element.querySelectorAll('*[data-key]')].reduce<Record<string, unknown>>((acc, input) => {
      const key = input.getAttribute('data-key');
      const type = <TInputType>input.getAttribute('type') ?? 'text';

      if (!key || 'value' in input === false || typeof input.value !== 'string') {
        return acc;
      }

      if (input.getAttribute('format') === 'array') {
        const value = input.value
          .split(',')
          .map((nested) => castInputValue(type, nested))
          .filter((nested) => nested !== null);

        return value.length ? _set(acc, key, value) : acc;
      }

      const value = castInputValue(type, input.value);

      if (type === 'checkbox' && 'checked' in input) {
        return input.checked ? _set(acc, key, value ?? true) : acc;
      }

      return value !== null ? _set(acc, key, value) : acc;
    }, {});
  }

  public assign(payload: object) {
    convertObjectToKeyValueCouples(payload).forEach(([path, value]) =>
      _set(
        this.element.querySelector(`*[data-key="${path}"]`)!,
        'value',
        Array.isArray(value) ? value.join(', ') : value
      )
    );

    return this;
  }

  static build(element: Element) {
    return new Form(element);
  }
}
