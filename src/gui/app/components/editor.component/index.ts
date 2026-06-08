import { Editor } from 'ace-builds/src-min-noconflict/ace';
import hbs from 'handlebars';

import ace from 'ace-builds/src-min-noconflict/ace';
import lang from 'ace-builds/src-min-noconflict/mode-json';
import theme from 'ace-builds/src-min-noconflict/theme-cloud9_night';

import { PartialDeep } from '../../../../../types';
import { Component } from '../../models';

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
