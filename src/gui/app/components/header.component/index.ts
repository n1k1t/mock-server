import EventEmitter from 'events';
import hbs from 'handlebars';
import _ from 'lodash';

import { Component, Section } from '../../models';
import { TFunction } from '../../../../types';

const template = hbs.compile(require('./template.hbs'));

type TTab = { type: 'section', entity: Section } | { type: 'separator' };

interface IEvents {
  select: [Section];
}

export class HeaderComponent extends Component {
  private events = new EventEmitter();

  public sections = this.tabs
    .map((tab) => tab.type === 'section' ? tab.entity : null)
    .filter(Boolean)
    .reduce<Record<string, Section>>((acc, section) => _.set(acc, section!.id, section), {});

  constructor(public tabs: TTab[]) {
    super(
      template({
        tabs: tabs.map(
          (tab) => tab.type === 'section'
            ? Object.assign(tab, { id: tab.entity.id, isSelected: !tab.entity.isHidden })
            : tab
        ),
      })
    );

    this.element.querySelector('div#tabs')!.addEventListener('click', (source) => {
      const event = <Event & { target: Element }>source;

      if (event.target?.nodeName !== 'BUTTON' || !this.sections[event.target.id]) {
        return null;
      }

      event.target.parentNode?.querySelectorAll('button.checked').forEach((element) => element.classList.remove('checked'));
      event.target.classList.add('checked');

      this.emit('select', this.sections[event.target.id]);
    });
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

  static build(tabs: TTab[]) {
    return new HeaderComponent(tabs);
  }
}
