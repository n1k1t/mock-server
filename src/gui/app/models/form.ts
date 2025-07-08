import _ from 'lodash';

import { convertObjectToKeyValueCouples } from '../utils';
import { Component, TElementPredicate } from './component';
import { PartialDeep } from '../../../../types';

type TInputType = 'text' | 'number' | 'password' | 'checkbox' | 'file';

export interface IFormFile {
  name: string;
  content: string;
}

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
    if (type === 'file') {
      return null;
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

  public async extract(): Promise<PartialDeep<T>> {
    const result: PartialDeep<T> = {};

    for (const input of this.element.querySelectorAll('*[data-key]')) {
      const key = input.getAttribute('data-key');
      const type = <TInputType>(input.getAttribute('cast') ?? input.getAttribute('type') ?? 'text');

      if (!key || 'value' in input === false || typeof input.value !== 'string') {
        continue;
      }

      if (type === 'file') {
        const files: IFormFile[] = [];

        for (const file of ('files' in input ? <FileList>input.files : new FileList())) {
          files.push({ name: file.name, content: await file.text() });
        }

        _.set(result, key, files);
        continue;
      }

      if (input.hasAttribute('list')) {
        const delimiter = input.getAttribute('list') ?? ',';
        const value = input.value
          .split(delimiter)
          .map((nested) => castInputValue(type, nested))
          .filter((nested) => nested !== null);

        if (value.length) {
          _.set(result, key, value)
        }

        continue;
      }

      const value = castInputValue(type, input.value);

      if (type === 'checkbox' && 'checked' in input) {
        if (input.checked) {
          _.set(result, key, value ?? true);
        }

        continue;
      }
      if (value !== null) {
        _.set(result, key, value);
      }
    }

    return result;
  }

  public assign(payload: PartialDeep<T>) {
    convertObjectToKeyValueCouples(payload, this.paths)
      .map(([path, value]) => <const>[path, value, this.element.querySelector(`*[data-key="${path}"]`)!])
      .forEach(([path, value, input]) =>
        _.set(input, 'value', Array.isArray(value) ? value.join(input.getAttribute('list') ?? ',') : (value ?? ''))
      );

    return this;
  }

  static build<T extends object>(predicate: TElementPredicate) {
    return new Form<T>(predicate);
  }
}
