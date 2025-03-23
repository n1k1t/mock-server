import hbs from 'handlebars';

import { CheckboxAreaComponent, EmptyComponent, ExpectationComponent, SearchComponent } from '../../components';
import { Section } from '../../models';
import { cast } from '../../../../utils/common';

import context from '../../context';

const template = hbs.compile(require('./template.hbs'));

const storage = new Map<string, ExpectationComponent>();
const empty = EmptyComponent.build();

const controls = {
  state: {
    filters: {
      search: cast<null | string>(null),
      groups: cast<null | string[]>(null),
    },
  },

  search: SearchComponent
    .build({ title: 'Search expectations' })
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

  switcher: CheckboxAreaComponent.build({
    title: 'Groups switcher',
    description: 'turnes on/off items in the list below',
    width: 'M',
    icon: 'fas fa-power-off',
  }),
};

const filter = (provided: ExpectationComponent[]): ExpectationComponent[] => {
  let filtred = provided;

  if (controls.state.filters.groups) {
    filtred = filtred.filter((expectation) => controls.state.filters.groups!.includes(expectation.data.group));
  }
  if (controls.state.filters.search) {
    filtred = filtred.filter((expectation) => expectation.match(controls.state.filters.search!));
  }

  return filtred;
}

const refresh = (list: ExpectationComponent[] = [...storage.values()]) => {
  const shown = filter(list.map((expectation) => expectation.hide())).map((expectation) => expectation.show());

  if (list.length === storage.size) {
    shown.length ? empty.hide() : empty.show();
  }
}

const toggle = (groups?: string[]) =>
  (groups ?? context.shared.groups).forEach((group) => {
    const filtred = [...storage.values()].filter((expectation) => expectation.data.group === group);

    filtred.every((expectation) => !expectation.data.isEnabled)
      ? controls.switcher.buttons.provided[group]?.disable('silent')
      : controls.switcher.buttons.provided[group]?.enable('silent');
  });

export default Section
  .build(template({}))
  .assignMeta({ name: 'Expectations', icon: 'fas fa-magic' })
  .once('initialize', (section) => {
    section.append(empty);

    section.controls.main.append(controls.search);
    section.controls.additional.append(controls.filter);
    section.controls.additional.append(controls.switcher);

    context.on('group:register', (name) => {
      controls.switcher.provide({ name, isEnabled: true, colorify: true });
      controls.filter.provide({ name, isEnabled: true, colorify: true });
    });

    controls.switcher.on('enable', (item) =>
      context.services.io.exec('expectations:group:update', { name: item.name, set: { isEnabled: true } })
    );

    controls.switcher.on('disable', (item) =>
      context.services.io.exec('expectations:group:update', { name: item.name, set: { isEnabled: false } })
    );

    controls.filter.on('enable', () => {
      controls.state.filters.groups = controls.filter.extract().filter((item) => item.isEnabled).map((item) => item.name);
      refresh();
    });

    controls.filter.on('disable', () => {
      controls.state.filters.groups = controls.filter.extract().filter((item) => item.isEnabled).map((item) => item.name);
      refresh();
    });

    context.services.io.subscribe('expectation:added', (data) => {
      const expectation = ExpectationComponent.build(data);

      storage.set(data.id, expectation);
      section.content.append(expectation);

      if (!context.shared.groups.has(data.group)) {
        context.shared.groups.add(data.group);
        context.emit('group:register', data.group);
      }

      refresh([expectation]);
      toggle([expectation.data.group]);
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

      if (!context.shared.groups.has(data.group)) {
        context.shared.groups.add(data.group);
        context.emit('group:register', data.group);
      }

      storage.set(data.id, expectation);
      toggle([expectation.data.group]);
    });
  })
  .on('initialize', async (section) => {
    context.shared.groups.clear();
    section.content.clear();

    controls.switcher.clear();
    controls.filter.clear();
    storage.clear();

    const { data } = await context.services.io.exec('expectations:get-list');

    data.forEach((expectation) => {
      const component = ExpectationComponent.build(expectation);

      if (!context.shared.groups.has(expectation.group)) {
        context.shared.groups.add(expectation.group);
        context.emit('group:register', expectation.group);
      }

      storage.set(expectation.id, component);
      section.content.append(component);
    });

    refresh();
    toggle();
  });
