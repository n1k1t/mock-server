import hbs from 'handlebars';

import { Button, Form, IFormFile, Section } from '../../models';
import { PanelComponent } from '../../components';

import context from '../../context';

const templates = {
  cacheRestoration: hbs.compile(require('./templates/cache-restoration.hbs')),
  cacheDeletion: hbs.compile(require('./templates/cache-deletion.hbs')),
  cacheBackup: hbs.compile(require('./templates/cache-backup.hbs')),

  section: hbs.compile(require('./templates/section.hbs')),
  stats: hbs.compile(require('./templates/stats.hbs')),
};

const panels = {
  stats: PanelComponent.build({
    title: {
      text: 'Stats',
      icon: 'fas fa-server'
    },

    class: 'stats',

    height: 'XS',
    width: 'M',
  }),

  cacheDeletion: PanelComponent
    .build({
      title: {
        text: 'Cache deletion',
        icon: 'fas fa-database',
      },

      class: 'cache',

      height: 'XS',
      width: 'M',
    })
    .replace(templates.cacheDeletion({})),

  cacheBackup: PanelComponent
    .build({
      title: {
        text: 'Cache backup',
        icon: 'fas fa-database',
      },

      class: 'cache',

      height: 'XS',
      width: 'M',
    })
    .replace(templates.cacheBackup({})),

  cacheRestoration: PanelComponent
    .build({
      title: {
        text: 'Cache restoration',
        icon: 'fas fa-database',
      },

      class: 'cache',

      height: 'XS',
      width: 'M',
    })
    .replace(templates.cacheRestoration({})),
};

export default Section
  .build(templates.section({}))
  .assignMeta({ icon: 'fas fa-cog' })
  .once('initialize', async (section) => {
    section.content.append(panels.stats);
    section.content.append(panels.cacheDeletion);
    section.content.append(panels.cacheBackup);
    section.content.append(panels.cacheRestoration);

    Button.build(panels.cacheDeletion.element.querySelector('button#delete')).handle(async () => {
      const extracted = await Form.build<{ prefix?: string }>(panels.cacheDeletion).extract();

      const { data } = await context.services.io.exec('cache:delete', { prefix: extracted.prefix });
      context.shared.popups.push(`Deleted <b>${data.redis?.count ?? 0}</b> cache keys`);
    });

    Button.build(panels.cacheBackup.element.querySelector('button#backup')).handle(async () => {
      const { data } = await context.services.io.exec('cache:backup');

      const link = document.createElement('a');
      const date = new Date();

      link.download = `mock-server-cache-backup-${date.toLocaleDateString()}-${date.getTime()}.txt`;
      link.href = URL.createObjectURL(new Blob([data], { type: 'text' }));

      link.click();
    });

    Button.build(panels.cacheRestoration.element.querySelector('button#restore')).handle(async () => {
      const extracted = await Form.build<{ files?: IFormFile[], ttl?: number }>(panels.cacheRestoration).extract();
      if (!extracted.files?.length) {
        return context.shared.popups.push('File is not provided', { level: 'warning' });
      }

      await context.instances.http.post('/cache/restore', { ttl: extracted.ttl, backup: extracted.files[0]!.content! });
      context.shared.popups.push('Restored');
    });
  })
  .on('select', async () => {
    const { data } = await context.services.io.exec('stats');
    panels.stats.replace(templates.stats(data));
  });
