import { EmptyComponent, ExpectationComponent, SearchComponent } from '../components';
import { Container } from '../models';
import { cast } from '../../../utils/common';

import context from '../context';

const empty = EmptyComponent.build();

const storage = new Map<string, ExpectationComponent>();
const state = { search: cast<null | string>(null) };

const search = SearchComponent
  .build({ title: 'Search expectations' })
  .on('clear', () => {
    state.search = null;
    refresh();
  })
  .on('input', (value) => {
    state.search = value;
    refresh();
  });

const filter = (expectations: ExpectationComponent[]): ExpectationComponent[] => {
  let filtred = expectations;

  if (context.shared.settings.filters.groups) {
    filtred = filtred.filter((expectation) => context.shared.settings.filters.groups!.has(expectation.data.group));
  }
  if (state.search) {
    filtred = filtred.filter((expectation) => expectation.match(state.search!));
  }

  return filtred;
}

const refresh = (expectations: ExpectationComponent[] = [...storage.values()]) => {
  const hidden = expectations.map((expectation) => expectation.hide());
  const shown = filter(hidden).map((expectation) => expectation.show());

  shown.length ? empty.hide() : empty.show();
}

export default Container
  .build(document.querySelector('section#expectations')!)
  .on('select', () => refresh())
  .on('initialize', async (container) => {
    context.shared.groups.clear();
    container.content.clear();

    storage.clear();

    const { data } = await context.services.io.exec('expectations:get-list');

    data.forEach((expectation) => {
      const component = ExpectationComponent.build(expectation);

      storage.set(expectation.id, component);

      context.shared.groups.add(expectation.group);
      container.content.append(component);
    });

    refresh();
  })
  .once('initialize', (container) => {
    container.prepend(empty);
    container.prepend(search);

    context.services.io.subscribe('expectation:added', (data) => {
      const expectation = ExpectationComponent.build(data);

      storage.set(data.id, expectation);
      context.shared.groups.add(data.group);

      container.content.append(expectation);
      refresh([expectation]);
    });

    context.services.io.subscribe('expectation:updated', (data) => {
      const expectation = storage.get(data.id) ?? ExpectationComponent.build(data);

      if (storage.has(data.id)) {
        expectation.refresh(data);
      }
      if (!container.content.element.querySelector(`div.expectation[id="${data.id}"]`)) {
        container.content.append(expectation);
        refresh([expectation])
      }

      storage.set(data.id, expectation);
      context.shared.groups.add(data.group);
    });
  });
