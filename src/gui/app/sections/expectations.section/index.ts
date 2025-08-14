import hbs from 'handlebars';

import { CheckboxAreaComponent, EmptyComponent, ExpectationComponent, SearchComponent } from '../../components';
import { Section } from '../../models';
import { cast } from '../../../../utils';

import context from '../../context';

const template = hbs.compile(require('./template.hbs'));
const empty = EmptyComponent.build();

const state = {
  storage: new Map<string, ExpectationComponent>(),

  filters: {
    search: cast<null | string>(null),
    groups: cast<null | string[]>(null),
  },
};

const panels = {
  search: SearchComponent
    .build({ title: 'Search expectations' })
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

      description: 'shows/hides items in the list below',
    },

    width: 'M',
  }),

  switcher: CheckboxAreaComponent.build({
    title: {
      text: 'Groups switcher',
      icon: 'fas fa-power-off',

      description: 'turnes on/off items in the list below',
    },

    width: 'M',
  }),
};

const filter = (provided: ExpectationComponent[]): ExpectationComponent[] => {
  let filtred = provided;

  if (state.filters.groups) {
    filtred = filtred.filter((expectation) => state.filters.groups!.includes(expectation.data.group));
  }
  if (state.filters.search) {
    filtred = filtred.filter((expectation) => expectation.match(state.filters.search!));
  }

  return filtred;
}

const refresh = (list: ExpectationComponent[] = [...state.storage.values()]) => {
  const shown = filter(list.map((expectation) => expectation.hide())).map((expectation) => expectation.show());

  if (list.length === state.storage.size) {
    shown.length ? empty.hide() : empty.show();
  }
}

const toggle = (groups?: string[]) =>
  (groups ?? context.services.groups.storage).forEach((group) => {
    const filtred = [...state.storage.values()].filter((expectation) => expectation.data.group === group);

    filtred.every((expectation) => !expectation.data.isEnabled)
      ? panels.switcher.buttons.provided[group]?.disable('silent')
      : panels.switcher.buttons.provided[group]?.enable('silent');
  });

const compileOptions = (): ExpectationComponent['TOptions'] => ({
  pathSize: context.services.settings.get('settings:visual:path-size'),
});

export default Section
  .build(template({}))
  .assignMeta({ name: 'Expectations', icon: 'fas fa-magic' })
  .once('initialize', (section) => {
    section.append(empty);

    section.controls.main.append(panels.search);
    section.controls.additional.append(panels.filter);
    section.controls.additional.append(panels.switcher);

    context.services.groups.on('register', (name) => {
      panels.switcher.provide({ name, isEnabled: true, colorify: true });
      panels.filter.provide({ name, isEnabled: true, colorify: true });
    });

    panels.switcher.on('enable', (button) =>
      context.services.io.exec('expectations:group:update', { name: button.name, set: { isEnabled: true } })
    );

    panels.switcher.on('disable', (button) =>
      context.services.io.exec('expectations:group:update', { name: button.name, set: { isEnabled: false } })
    );

    panels.filter.on('switch', (buttons) => {
      state.filters.groups = buttons.filter((button) => button.isEnabled).map((button) => button.name);
      refresh();
    });

    context.services.settings.on('assign:settings:visual:path-size', () =>
      state.storage.forEach((expectation) => expectation.refresh(compileOptions()))
    );

    context.services.io.subscribe('expectation:added', (data) => {
      const expectation = ExpectationComponent.build(data, compileOptions());

      state.storage.set(data.id, expectation);
      context.services.groups.register(data.group);

      section.content.append(expectation);

      refresh([expectation]);
      toggle([expectation.data.group]);
    });

    context.services.io.subscribe('expectation:updated', (data) => {
      const expectation = state.storage.get(data.id) ?? ExpectationComponent.build(data, compileOptions());

      if (state.storage.has(data.id)) {
        expectation.provide(data).refresh(compileOptions());
      }

      if (!section.content.element.querySelector(`div.expectation[id="${data.id}"]`)) {
        section.content.append(expectation);
        refresh([expectation])
      }

      state.storage.set(data.id, expectation);
      context.services.groups.register(data.group);

      toggle([expectation.data.group]);
    });
  })
  .on('initialize', async (section) => {
    context.services.groups.clear();
    section.content.clear();

    panels.switcher.clear();
    panels.filter.clear();
    state.storage.clear();

    const { data } = await context.services.io.exec('expectations:get-list');

    data.forEach((expectation) => {
      const component = ExpectationComponent.build(expectation, compileOptions());

      state.storage.set(expectation.id, component);
      context.services.groups.register(expectation.group);

      section.content.append(component);
    });

    refresh();
    toggle();
  });
