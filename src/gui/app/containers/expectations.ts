import { EmptyComponent, ExpectationComponent } from '../components';
import { Container } from '../models';

import context from '../context';

const empty = EmptyComponent.build();
const storage = new Map<string, ExpectationComponent>();

const container = Container
  .build(document.querySelector('section#expectations')!)
  .once('intialize', async () => {
    const { data } = await context.services.ws.exec('expectations:get');

    data.forEach((expectation) => {
      const component = ExpectationComponent.build(expectation);

      storage.set(expectation.id, component);
      container.append(component);
    });

    storage.size ? empty.hide() : empty.show();
  })
  .once('intialize', () => {
    context.services.ws.subscribe('expectation:added', (expectation) => {
      const component = ExpectationComponent.build(expectation);

      storage.set(expectation.id, component);
      container.append(component);

      empty.hide();
    });

    context.services.ws.subscribe('expectation:updated', (expectation) => {
      const component = storage.get(expectation.id) ?? ExpectationComponent.build(expectation);

      if (storage.has(expectation.id)) {
        component.refresh(expectation);
      }
      if (!container.element.querySelector(`div.expectation[id="${expectation.id}"]`)) {
        container.append(component);
      }

      storage.set(expectation.id, component);
      empty.hide();
    });
  });

export default container.append(empty);
