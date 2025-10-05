import dayjs from 'dayjs';
import hbs from 'handlebars';

import { HistoryComponent } from './components';
import { Button, Section } from '../../models';
import { cast } from '../../../../utils';
import {
  CheckboxAreaComponent,
  EmptyComponent,
  PanelComponent,
  SearchComponent,
  SeparatorComponent,
} from '../../components';

import context from '../../context';

const empty = EmptyComponent.build();
const templates = {
  section: hbs.compile(require('./templates/section.hbs')),
  actions: hbs.compile(require('./templates/actions.hbs')),
};

const state = {
  storage: new Map<string, HistoryComponent>(),
  stack: cast<string[]>([]),

  separators: {
    date: new Set<SeparatorComponent>(),
    custom: new Set<SeparatorComponent>(),
  },

  filters: {
    search: cast<null | string>(null),
    groups: cast<null | string[]>(null),
  },
};

const panels = {
  search: SearchComponent
    .build({ title: 'Search history' })
    .on('clear', () => {
      state.filters.search = null;
      refresh();
    })
    .on('input', (value) => {
      state.filters.search = value;
      refresh();
    }),

  filter: CheckboxAreaComponent.build({
    title: {
      text: 'Groups filter',
      icon: 'fas fa-filter',

      description: 'shows/hides items in the list below'
    },

    storage: {
      key: 'history:filters:groups',
    },

    width: 'L',
  }),

  actions: PanelComponent
    .build({
      title: {
        text: 'Actions',
        icon: 'fas fa-sliders-h',
      },

      class: 'actions',
      width: 'L',
    })
    .append(templates.actions({})),
};

const filter = (list: HistoryComponent[]): HistoryComponent[] => {
  let filtred = list;

  if (state.filters.groups) {
    filtred = filtred.filter((history) => state.filters.groups!.includes(history.data.group));
  }
  if (state.filters.search) {
    filtred = filtred.filter((history) => history.match(state.filters.search!));
  }

  return filtred;
}

const separate = (list: HistoryComponent[] = [...state.storage.values()]) => {
  const timestamp = Date.now();

  const groups: Record<string, HistoryComponent> = {};
  const matrix: Record<string, number> = {
    '30 seconds ago': timestamp - 30 * 1000,
    '1 minute ago': timestamp - 60 * 1000,
    '5 minutes ago': timestamp - 5 * 60 * 1000,
    '15 minutes ago': timestamp - 15 * 60 * 1000,
    '30 minutes ago': timestamp - 30 * 60 * 1000,
    '1 hour ago': timestamp - 60 * 60 * 1000,
    '3 hours ago': timestamp - 3 * 60 * 60 * 1000,
    '6 hours ago': timestamp - 6 * 60 * 60 * 1000,
    '12 hours ago': timestamp - 12 * 60 * 60 * 1000,
  };

  const sequence = Object.keys(matrix).reverse();
  const today = +dayjs().startOf('day');

  for (const separator of state.separators.date.values()) {
    state.separators.date.delete(separator);
    separator.delete();
  }

  list.sort((a, b) => b.data.timestamp - a.data.timestamp).forEach((history) => {
    if (history.isHidden) {
      return null;
    }

    if (history.data.timestamp < today) {
      const date = dayjs(history.data.timestamp).format('DD MMM');

      groups[date] = groups[date] ?? history;
      return null;
    }

    for (const title of sequence) {
      if (groups[title]) {
        break;
      }
      if (history.data.timestamp < matrix[title]) {
        groups[title] = history;
        break;
      }
    }
  });

  Object.entries(groups).forEach(([title, history]) => {
    const separator = SeparatorComponent.build(title);

    history.element.insertAdjacentElement('beforebegin', separator.element);
    state.separators.date.add(separator);
  });
}

const refresh = (list: HistoryComponent[] = [...state.storage.values()]) => {
  const shown = filter(list.map((history) => history.hide())).map((history) => history.show());

  if (list.length === state.storage.size) {
    shown.length ? empty.hide() : empty.show();
    separate(shown);
  }
}

const compileOptions = (): HistoryComponent['TOptions'] => ({
  pathSize: context.services.settings.get('settings:visual:path-size'),
});

export default Section
  .build(templates.section({}))
  .assignMeta({ name: 'History', icon: 'fas fa-history' })
  .once('initialize', (section) => {
    section.append(empty);

    section.controls.main.append(panels.search);
    section.controls.additional.append(panels.filter);
    section.controls.additional.append(panels.actions);

    Button.build(panels.actions.element.querySelector('button#clear')).handle(async () => {
      if (!state.stack.length) {
        return context.shared.popups.push('Nothing to clear', { level: 'warning' });
      }

      await context.services.io.exec('history:delete');

      state.separators.custom.clear();
      state.separators.date.clear();

      state.storage.clear();
      state.stack = [];

      section.content.clear();
      context.shared.popups.push('History has cleared');

      refresh();
    });

    Button.build(panels.actions.element.querySelector('button#add-separator')).handle(() => {
      const separator = SeparatorComponent.build(`#${state.separators.custom.size + 1}`).highlight();

      section.content.prepend(separator);
      state.separators.custom.add(separator);
    });

    Button.build(panels.actions.element.querySelector('button#delete-separators')).handle(() => {
      for (const separator of state.separators.custom.values()) {
        state.separators.custom.delete(separator);
        separator.delete();
      }
    });

    context.services.groups.on('register', (name) =>
      panels.filter.provide({ name, isEnabled: true, colorify: { prefix: 'group' } })
    );

    context.services.settings.on('assign:settings:visual:path-size', () =>
      state.storage.forEach((history) => history.refresh(compileOptions()))
    );

    panels.filter.on('switch', (buttons) => {
      state.filters.groups = buttons.filter((button) => button.isEnabled).map((button) => button.name);
      refresh();
    });

    context.services.io.subscribe('history:added', (data) => {
      const history = HistoryComponent.build(data, compileOptions());

      state.storage.set(data.id, history);
      state.stack.push(data.id);

      if (state.stack.length > context.services.config.storage.history.limit * context.services.groups.storage.size) {
        const id = state.stack.shift()!;

        state.storage.get(id)?.delete();
        state.storage.delete(id);
      }

      section.content.prepend(history);
      refresh([history]);
    });

    context.services.io.subscribe('history:updated', (data) => {
      const history = state.storage.get(data.id) ?? HistoryComponent.build(data, compileOptions());

      state.storage.has(data.id) ? history.provide(data).refresh(compileOptions()) : state.stack.push(data.id);
      state.storage.set(data.id, history);

      if (!section.element.querySelector(`div.history[id="${data.id}"]`)) {
        section.content.prepend(history);
        refresh([history]);
      }
    });

    setInterval(() => separate(), 30 * 1000);
  })
  .on('initialize', async (section) => {
    panels.filter.clear();
    state.stack = [];

    section.content.clear();
    state.storage.clear();

    const { data } = await context.services.io.exec('history:compact:get-list');

    data.forEach((history) => {
      const component = HistoryComponent.build(history, compileOptions());

      state.storage.set(history.id, component);
      state.stack.push(history.id);

      section.content.append(component);
    });

    panels.filter.trigger();
    refresh();
  });
