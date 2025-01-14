import hbs from 'handlebars';

import { Component } from '../../models';
import { cast } from '../../../../utils/common';

import context from '../../context';

const template = require('./template.hbs');
const render = hbs.compile(template);

export class SettingsComponent extends Component {
  public filters = this.compileEmptyFilters();

  constructor() {
    super();
  }

  public resetFilters() {
    this.filters = this.compileEmptyFilters();
    return this;
  }

  public refresh() {
    this.clear().append(
      render({
        groups: {
          all: {
            isEnabled: this.filters.groups ? this.filters.groups.size === context.shared.groups.size : true,
          },

          segmented: [...context.shared.groups].map((group) => ({
            name: group,
            isEnabled: this.filters.groups?.has(group) ?? true,
          })),
        },
      })
    );

    const groupsFilterButtons = {
      all: this.element.querySelector('div#groups-filter button#all')!,
      segmented: this.element.querySelectorAll('div#groups-filter button:not(#all)')!,
    };

    groupsFilterButtons.all.addEventListener('click', (event) => {
      const isChecked = (<Element>event.target).classList.toggle('checked');

      this.filters.groups = isChecked ? new Set(context.shared.groups.values()) : new Set();

      groupsFilterButtons.segmented.forEach(
        (element) => isChecked ? element.classList.add('checked') : element.classList.remove('checked')
      );
    });

    groupsFilterButtons.segmented.forEach((element) =>
      element.addEventListener('click', () => {
        const isChecked = element.classList.toggle('checked');

        this.filters.groups = this.filters.groups ?? new Set(context.shared.groups.values());
        isChecked ? this.filters.groups.add(element.id) : this.filters.groups.delete(element.id);

        this.filters.groups.size === context.shared.groups.size
          ? groupsFilterButtons.all.classList.add('checked')
          : groupsFilterButtons.all.classList.remove('checked');
      })
    );

    return this;
  }

  private compileEmptyFilters() {
    return {
      groups: cast<Set<string> | null>(null),
    };
  }

  static build() {
    return new SettingsComponent();
  }
}
