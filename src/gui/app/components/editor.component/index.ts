import { Editor } from 'ace-builds';
import hbs from 'handlebars';

import { PartialDeep } from '../../../../../types';
import { Component } from '../../models';

const ace = require('ace-builds/src-min/ace');
const lang = require('ace-builds/src-min/mode-json');
const theme = require('ace-builds/src-min/theme-cloud9_night');

const render = hbs.compile(require('./template.hbs'));

export class EditorComponent<T extends object = object> extends Component {
  public instance = <Editor>ace.edit(this.element);

  constructor(public options?: {}) {
    super(render({}));

    this.instance.setAnimatedScroll(false);
    this.instance.setTheme(theme);
    this.instance.session.setTabSize(2);
    this.instance.session.setUseWorker(false);
    this.instance.session.setMode(new lang.Mode());

    this.provide({});
  }

  public extract(): T | null {
    return JSON.parse(this.instance.getValue() || 'null');
  }

  public clear(): this {
    this.instance.setValue('');
    return this;
  }

  public provide(payload: PartialDeep<T> | null): this {
    this.instance.setValue(JSON.stringify(payload, null, 2));
    this.instance.selection.clearSelection();

    return this;
  }

  static build<T extends object>(options?: EditorComponent<T>['options']): EditorComponent<T> {
    return new EditorComponent(options);
  }
}
