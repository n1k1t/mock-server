import _unset from 'lodash/unset';
import _set from 'lodash/set';
import hbs from 'handlebars';

import { EmptyComponent, HistoryComponent, SearchComponent } from '../../components';
import { Section } from '../../models';
import { cast } from '../../../../utils/common';

import context from '../../context';

const template = require('./template.hbs');
const render = hbs.compile(template);

const empty = EmptyComponent.build();
const storage = new Map<string, HistoryComponent>();

const stack: string[] = [];
const state = { search: cast<null | string>(null) };

const search = SearchComponent
  .build({ title: 'Search history' })
  .on('clear', () => {
    state.search = null;
    refresh();
  })
  .on('input', (value) => {
    state.search = value;
    refresh();
  });

const filter = (list: HistoryComponent[]): HistoryComponent[] => {
  let filtred = list;

  if (context.shared.settings.filters.groups) {
    filtred = filtred.filter((history) => context.shared.settings.filters.groups!.has(history.data.group));
  }
  if (state.search) {
    filtred = filtred.filter((history) => history.match(state.search!));
  }

  return filtred;
}

const refresh = (list: HistoryComponent[] = [...storage.values()]) => {
  const shown = filter(list.map((history) => history.hide())).map((history) => history.show());

  if (list.length === storage.size) {
    shown.length ? empty.hide() : empty.show();
  }
}

export default Section
  .build(render({}))
  .assignMeta({ name: 'History', icon: 'fas fa-history' })
  .on('select', () => refresh())
  .on('initialize', async (section) => {
    section.content.clear();

    storage.clear();
    stack.splice(0, stack.length);

    const { data } = await context.services.io.exec('history:get-list');

    data.forEach((history) => {
      const component = HistoryComponent.build(history);

      storage.set(history.id, component);
      stack.push(history.id);

      section.content.append(component);
    });

    refresh();
  })
  .once('initialize', (section) => {
    section.prepend(empty);
    section.prepend(search);

    context.services.io.subscribe('history:added', (data) => {
      const history = HistoryComponent.build(data);

      storage.set(data.id, history);
      stack.push(data.id);

      if (stack.length > context.config.history.limit * context.shared.groups.size) {
        const id = stack.shift()!;

        storage.get(id)?.delete();
        storage.delete(id);
      }

      section.content.prepend(history);
      refresh([history]);
    });

    context.services.io.subscribe('history:updated', (data) => {
      const history = storage.get(data.id) ?? HistoryComponent.build(data);

      storage.has(data.id) ? history.provide(data).refresh() : stack.push(data.id);
      storage.set(data.id, history);

      if (!section.element.querySelector(`div.history[id="${data.id}"]`)) {
        section.content.prepend(history);
        refresh([history]);
      }
    });
  });
