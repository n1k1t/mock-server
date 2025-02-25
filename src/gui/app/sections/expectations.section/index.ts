import hbs from 'handlebars';

import { EmptyComponent, ExpectationComponent, SearchComponent } from '../../components';
import { Section } from '../../models';
import { cast } from '../../../../utils/common';

import context from '../../context';

const template = require('./template.hbs');
const render = hbs.compile(template);

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

const filter = (list: ExpectationComponent[]): ExpectationComponent[] => {
  let filtred = list;

  if (context.shared.settings.filters.groups) {
    filtred = filtred.filter((expectation) => context.shared.settings.filters.groups!.has(expectation.data.group));
  }
  if (state.search) {
    filtred = filtred.filter((expectation) => expectation.match(state.search!));
  }

  return filtred;
}

const refresh = (list: ExpectationComponent[] = [...storage.values()]) => {
  const shown = filter(list.map((expectation) => expectation.hide())).map((expectation) => expectation.show());

  if (list.length === storage.size) {
    shown.length ? empty.hide() : empty.show();
  }
}

export default Section
  .build(render({}))
  .assignMeta({ name: 'Expectations', icon: 'fas fa-magic' })
  .on('select', () => refresh())
  .on('initialize', async (section) => {
    context.shared.groups.clear();
    section.content.clear();

    storage.clear();

    const { data } = await context.services.io.exec('expectations:get-list');

    data.forEach((expectation) => {
      const component = ExpectationComponent.build(expectation);

      storage.set(expectation.id, component);

      context.shared.groups.add(expectation.group);
      section.content.append(component);
    });

    refresh();
  })
  .once('initialize', (section) => {
    section.prepend(empty);
    section.prepend(search);

    context.services.io.subscribe('expectation:added', (data) => {
      const expectation = ExpectationComponent.build(data);

      storage.set(data.id, expectation);
      context.shared.groups.add(data.group);

      section.content.append(expectation);
      refresh([expectation]);
    });

    context.services.io.subscribe('expectation:updated', (data) => {
      const expectation = storage.get(data.id) ?? ExpectationComponent.build(data);

      if (storage.has(data.id)) {
        expectation.provide(data).refresh();
      }
      if (!section.content.element.querySelector(`div.expectation[id="${data.id}"]`)) {
        section.content.append(expectation);
        refresh([expectation])
      }

      storage.set(data.id, expectation);
      context.shared.groups.add(data.group);
    });
  });
