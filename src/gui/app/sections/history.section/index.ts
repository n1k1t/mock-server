import _unset from 'lodash/unset';
import _set from 'lodash/set';
import hbs from 'handlebars';

import { Button, Section } from '../../models';
import { cast } from '../../../../utils/common';
import {
  CheckboxAreaComponent,
  EmptyComponent,
  HistoryComponent,
  PanelComponent,
  SearchComponent,
} from '../../components';

import context from '../../context';

const templates = {
  section: hbs.compile(require('./templates/section.hbs')),
  actions: hbs.compile(require('./templates/actions.hbs')),
};

const empty = EmptyComponent.build();

const controls = {
  state: {
    storage: new Map<string, HistoryComponent>(),
    stack: cast<string[]>([]),

    filters: {
      search: cast<null | string>(null),
      groups: cast<null | string[]>(null),
    },
  },

  search: SearchComponent
    .build({ title: 'Search history' })
    .on('clear', () => {
      controls.state.filters.search = null;
      refresh();
    })
    .on('input', (value) => {
      controls.state.filters.search = value;
      refresh();
    }),

  filter: CheckboxAreaComponent.build({
    title: 'Groups filter',
    description: 'shows/hides items in the list below',
    width: 'M',
    icon: 'fas fa-filter',
  }),

  actions: PanelComponent
    .build({
      title: 'Actions',
      class: 'actions',
      width: 'M',
      icon: 'fas fa-sliders-h',
    })
    .append(templates.actions({})),
};

const filter = (list: HistoryComponent[]): HistoryComponent[] => {
  let filtred = list;

  if (controls.state.filters.groups) {
    filtred = filtred.filter((history) => controls.state.filters.groups!.includes(history.data.group));
  }
  if (controls.state.filters.search) {
    filtred = filtred.filter((history) => history.match(controls.state.filters.search!));
  }

  return filtred;
}

const refresh = (list: HistoryComponent[] = [...controls.state.storage.values()]) => {
  const shown = filter(list.map((history) => history.hide())).map((history) => history.show());

  if (list.length === controls.state.storage.size) {
    shown.length ? empty.hide() : empty.show();
  }
}

export default Section
  .build(templates.section({}))
  .assignMeta({ name: 'History', icon: 'fas fa-history' })
  .once('initialize', (section) => {
    section.append(empty);

    section.controls.main.append(controls.search);
    section.controls.additional.append(controls.filter);
    section.controls.additional.append(controls.actions);

    Button.build(controls.actions.element.querySelector('button#clear')!).handle(async () => {
      if (!controls.state.stack.length) {
        return context.shared.popups.push('Nothing to clear', { level: 'warning' });
      }

      await context.services.io.exec('history:delete');

      controls.state.storage.clear();
      controls.state.stack = [];

      section.content.clear();
      context.shared.popups.push('History has cleared');

      refresh();
    });

    context.on('group:register', (name) => controls.filter.provide({ name, isEnabled: true, colorify: true }));

    controls.filter.on('enable', () => {
      controls.state.filters.groups = controls.filter.extract().filter((item) => item.isEnabled).map((item) => item.name);
      refresh();
    });

    controls.filter.on('disable', () => {
      controls.state.filters.groups = controls.filter.extract().filter((item) => item.isEnabled).map((item) => item.name);
      refresh();
    });

    context.services.io.subscribe('history:added', (data) => {
      const history = HistoryComponent.build(data);

      controls.state.storage.set(data.id, history);
      controls.state.stack.push(data.id);

      if (controls.state.stack.length > context.config.history.limit * context.shared.groups.size) {
        const id = controls.state.stack.shift()!;

        controls.state.storage.get(id)?.delete();
        controls.state.storage.delete(id);
      }

      section.content.prepend(history);
      refresh([history]);
    });

    context.services.io.subscribe('history:updated', (data) => {
      const history = controls.state.storage.get(data.id) ?? HistoryComponent.build(data);

      controls.state.storage.has(data.id) ? history.provide(data).refresh() : controls.state.stack.push(data.id);
      controls.state.storage.set(data.id, history);

      if (!section.element.querySelector(`div.history[id="${data.id}"]`)) {
        section.content.prepend(history);
        refresh([history]);
      }
    });
  })
  .on('initialize', async (section) => {
    controls.filter.clear();
    controls.state.stack = [];

    section.content.clear();
    controls.state.storage.clear();

    const { data } = await context.services.io.exec('history:get-list');

    data.forEach((history) => {
      const component = HistoryComponent.build(history);

      controls.state.storage.set(history.id, component);
      controls.state.stack.push(history.id);

      section.content.append(component);
    });

    refresh();
  });
