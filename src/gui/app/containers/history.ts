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
  .on('intialize', async () => {
    container.clear().append(empty);

    storage.clear();
    ids.splice(0, ids.length);

    const { data } = await context.services.ws.exec('history:get');

    data.forEach((history) => {
      const component = HistoryComponent.build(history);

      storage.set(history.id, component);
      ids.push(history.id);

      container.append(component);
    });

    storage.size ? empty.hide() : empty.show();
  })
  .once('intialize', () => {
    context.services.ws.subscribe('history:added', (history) => {
      const component = HistoryComponent.build(history);

      storage.set(history.id, component);
      ids.push(history.id);

      if (ids.length > context.config.history.limit) {
        const id = ids.shift()!;

        storage.get(id)?.remove();
        storage.delete(id);
      }

      container.prepend(component);
      empty.hide();
    });

    context.services.ws.subscribe('history:updated', (history) => {
      const component = storage.get(history.id) ?? HistoryComponent.build(history);

      storage.has(history.id)
        ? component.refresh(history)
        : ids.push(history.id);

      container.element.childNodes.values()

      if (!container.element.querySelector(`div.history[id="${history.id}"]`)) {
        container.append(component);
      }

      storage.set(history.id, component);
      empty.hide();
    });
  });

export default container;
