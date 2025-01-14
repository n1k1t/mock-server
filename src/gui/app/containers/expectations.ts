import { EmptyComponent, ExpectationComponent } from '../components';
import { Container } from '../models';

import context from '../context';

const empty = EmptyComponent.build();
const storage = new Map<string, ExpectationComponent>();

const container = Container
  .build(document.querySelector('section#expectations')!)
  .on('select', () => {
    if (context.shared.settings.filters.groups) {
      empty.hide();

      const components = [...storage.values()].map((component) =>
        context.shared.settings.filters.groups!.has(component.expectation.group)
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

    context.shared.groups.clear();
    storage.clear();

    const { data } = await context.services.io.exec('expectations:get-list');

    data.forEach((expectation) => {
      const component = ExpectationComponent.build(expectation);

      storage.set(expectation.id, component);
      context.shared.groups.add(expectation.group);

      container.append(component);
    });

    storage.size ? empty.hide() : empty.show();
  })
  .once('initialize', () => {
    context.services.io.subscribe('expectation:added', (expectation) => {
      const component = ExpectationComponent.build(expectation);

      storage.set(expectation.id, component);
      context.shared.groups.add(expectation.group);

      container.append(component);

      !(context.shared.settings.filters.groups?.has(expectation.group) ?? true)
        ? component.hide()
        : empty.hide();
    });

    context.services.io.subscribe('expectation:updated', (expectation) => {
      const component = storage.get(expectation.id) ?? ExpectationComponent.build(expectation);

      if (storage.has(expectation.id)) {
        component.refresh(expectation);
      }
      if (!container.element.querySelector(`div.expectation[id="${expectation.id}"]`)) {
        container.append(component);
      }

      storage.set(expectation.id, component);
      context.shared.groups.add(expectation.group);

      !(context.shared.settings.filters.groups?.has(expectation.group) ?? true)
        ? component.hide()
        : empty.hide();
    });
  });

export default container;
