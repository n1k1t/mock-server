import hbs from 'handlebars';

import { Section } from '../../models';
import context from '../../context';

const template = require('./template.hbs');
const render = hbs.compile(template);

export default Section
  .build(render({}))
  .assignMeta({ icon: 'fas fa-cog' })
  .on('select', async () => {
    context.shared.settings.refresh();
  })
  .on('initialize', () => {
    context.shared.settings.resetFilters();
    context.shared.settings.refresh();
  })
  .once('initialize', (section) => {
    section.append(context.shared.settings);
  });
