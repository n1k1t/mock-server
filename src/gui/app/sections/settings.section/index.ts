import hbs from 'handlebars';

import { PanelComponent } from '../../components';
import { Button, Form, Section } from '../../models';

import context from '../../context';

const templates = {
  section: hbs.compile(require('./templates/section.hbs')),
  cache: hbs.compile(require('./templates/cache.hbs')),
  stats: hbs.compile(require('./templates/stats.hbs')),
};

const panels = {
  stats: PanelComponent.build({
    title: 'Stats',
    icon: 'fas fa-server',

    class: 'stats',

    height: 'XS',
    width: 'M',
  }),

  cache: PanelComponent
    .build({
      title: 'Cache',
      icon: 'fas fa-database',

      class: 'cache',

      height: 'XS',
      width: 'M',
    })
    .replace(templates.cache({})),
};

export default Section
  .build(templates.section({}))
  .assignMeta({ icon: 'fas fa-cog' })
  .once('initialize', async (section) => {
    const form = Form.build<{
      cache: {
        prefix: string;
      };
    }>(section.content);

    section.content.append(panels.stats);
    section.content.append(panels.cache);

    Button.build(panels.cache.element.querySelector('button#delete')!).handle(async () => {
      const { data } = await context.services.io.exec('cache:delete', form.extract().cache);
      context.shared.popups.push(`Deleted <b>${data.redis?.count ?? 0}</b> cache keys`);
    });
  })
  .on('select', async () => {
    const { data } = await context.services.io.exec('stats');
    panels.stats.replace(templates.stats(data));
  });
