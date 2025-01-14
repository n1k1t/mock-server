import _unset from 'lodash/unset';
import _set from 'lodash/set';

import { EmptyComponent, HistoryComponent } from '../components';
import { Container } from '../models';

import context from '../context';

const empty = EmptyComponent.build();

const storage = new Map<string, HistoryComponent>();
const ids: string[] = [];

const container = Container
  .build(document.querySelector('section#history')!)
  .on('select', () => {
    if (context.shared.settings.filters.groups) {
      empty.hide();

      const components = [...storage.values()].map((component) =>
        context.shared.settings.filters.groups!.has(component.history.group)
          ? component.show()
          : component.hide()
      );

      if (components.every((component) => component.isHidden)) {
        empty.show();
      }
    }
  })
  .on('initialize', async () => {
    container.clear().append(empty);

    storage.clear();
    ids.splice(0, ids.length);

    const { data } = await context.services.io.exec('history:get-list');

    data.forEach((history) => {
      const component = HistoryComponent.build(history);

      storage.set(history.id, component);
      ids.push(history.id);

      container.append(component);
    });

    storage.size ? empty.hide() : empty.show();
  })
  .once('initialize', () => {
    context.services.io.subscribe('history:added', (history) => {
      const component = HistoryComponent.build(history);

      storage.set(history.id, component);
      ids.push(history.id);

      if (ids.length > context.config.history.limit * context.shared.groups.size) {
        const id = ids.shift()!;

        storage.get(id)?.remove();
        storage.delete(id);
      }

      container.prepend(component);

      !(context.shared.settings.filters.groups?.has(history.group) ?? true)
        ? component.hide()
        : empty.hide();
    });

    context.services.io.subscribe('history:updated', (history) => {
      const component = storage.get(history.id) ?? HistoryComponent.build(history);

      storage.has(history.id) ? component.refresh(history) : ids.push(history.id);
      storage.set(history.id, component);

      if (!container.element.querySelector(`div.history[id="${history.id}"]`)) {
        container.prepend(component);
      }

      !(context.shared.settings.filters.groups?.has(history.group) ?? true)
        ? component.hide()
        : empty.hide();
    });
  });

export default container;
