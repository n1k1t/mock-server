import _unset from 'lodash/unset';
import _set from 'lodash/set';

import { EmptyComponent, HistoryComponent, SearchComponent } from '../components';
import { Container } from '../models';
import { cast } from '../../../utils/common';

import context from '../context';

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

const filter = (history: HistoryComponent[]): HistoryComponent[] => {
  let filtred = history;

  if (context.shared.settings.filters.groups) {
    filtred = filtred.filter((history) => context.shared.settings.filters.groups!.has(history.data.group));
  }
  if (state.search) {
    filtred = filtred.filter((history) => history.match(state.search!));
  }

  return filtred;
}

const refresh = (history: HistoryComponent[] = [...storage.values()]) => {
  const hidden = history.map((history) => history.hide());
  const shown = filter(hidden).map((history) => history.show());

  shown.length ? empty.hide() : empty.show();
}

export default Container
  .build(document.querySelector('section#history')!)
  .on('select', () => refresh())
  .on('initialize', async (container) => {
    container.content.clear();

    storage.clear();
    stack.splice(0, stack.length);

    const { data } = await context.services.io.exec('history:get-list');

    data.forEach((history) => {
      const component = HistoryComponent.build(history);

      storage.set(history.id, component);
      stack.push(history.id);

      container.content.append(component);
    });

    refresh();
  })
  .once('initialize', (container) => {
    container.prepend(empty);
    container.prepend(search);

    context.services.io.subscribe('history:added', (data) => {
      const history = HistoryComponent.build(data);

      storage.set(data.id, history);
      stack.push(data.id);

      if (stack.length > context.config.history.limit * context.shared.groups.size) {
        const id = stack.shift()!;

        storage.get(id)?.delete();
        storage.delete(id);
      }

      container.content.prepend(history);
      refresh([history]);
    });

    context.services.io.subscribe('history:updated', (data) => {
      const history = storage.get(data.id) ?? HistoryComponent.build(data);

      storage.has(data.id) ? history.refresh(data) : stack.push(data.id);
      storage.set(data.id, history);

      if (!container.element.querySelector(`div.history[id="${data.id}"]`)) {
        container.content.prepend(history);
        refresh([history]);
      }
    });
  });
