import hbs from 'handlebars';
import _ from 'lodash';

import { CheckboxAreaComponent, PanelComponent, SeparatorComponent } from '../../components';
import { Button, DynamicStorage, FormFile, Section } from '../../models';
import { TSettingsVisualPathSize } from '../../types';
import { socketIoStream } from '../../../../utils';

import context from '../../context';

const templates = {
  cacheRestoration: hbs.compile(require('./templates/cache-restoration.hbs')),
  cacheDeletion: hbs.compile(require('./templates/cache-deletion.hbs')),
  cacheBackup: hbs.compile(require('./templates/cache-backup.hbs')),

  section: hbs.compile(require('./templates/section.hbs')),
  stats: hbs.compile(require('./templates/stats.hbs')),
};

const panels = {
  system: {
    stats: PanelComponent.build({
      title: {
        text: 'Stats',
        icon: 'fas fa-server'
      },

      class: 'stats',

      height: 'XS',
      width: 'XS',
    }),
  },

  cache: {
    deletion: PanelComponent
      .build({
        title: {
          text: 'Cache deletion',
          icon: 'fas fa-database',
        },

        class: 'cache',

        height: 'XS',
        width: 'S',
      })
      .replace(templates.cacheDeletion({})),

    backup: PanelComponent
      .build({
        title: {
          text: 'Cache backup',
          icon: 'fas fa-database',
        },

        class: 'cache',

        height: 'XS',
        width: 'XS',
      })
      .replace(templates.cacheBackup({})),

    restoration: PanelComponent
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
  },

  visual: {
    pathSize: CheckboxAreaComponent
      .build<TSettingsVisualPathSize>({
        title: {
          text: 'Expectation/history path box size',
          icon: 'fas fa-palette',
        },

        storage: {
          key: 'settings:visual:path-size',
        },

        class: 'visual',
        type: 'radio',

        height: 'XS',
        width: 'S',
      })
      .provide(
        { name: 'S' },
        { name: 'M', isEnabled: true },
        { name: 'L' },
        { name: 'XL' },
        { name: 'XXL' },
        { name: 'Unlimited' }
      ),
  },
};

const storages = {
  cache: {
    deletion: DynamicStorage.build<{ prefix?: string }>('settings:cache:deletion', panels.cache.deletion),
    restoration: DynamicStorage.build<{
      files?: FormFile[];
      ttl?: number;
    }>('settings:cache:restoration', panels.cache.restoration),
  },
};

export default Section
  .build(templates.section({}))
  .assignMeta({ icon: 'fas fa-cog' })
  .once('initialize', (section) => {
    section.content.append(SeparatorComponent.build('System'));
    section.content.append(panels.system.stats);

    section.content.append(SeparatorComponent.build('Cache'));
    section.content.append(panels.cache.backup);
    section.content.append(panels.cache.restoration);
    section.content.append(panels.cache.deletion);

    section.content.append(SeparatorComponent.build('Visual'));
    section.content.append(panels.visual.pathSize);

    storages.cache.deletion.sync();
    storages.cache.restoration.sync();

    Button.build(panels.cache.deletion.element.querySelector('button#delete')).handle(async () => {
      const extracted = await storages.cache.deletion.save();

      const { data } = await context.services.io.exec('cache:delete', { prefix: extracted.prefix });
      context.shared.popups.push(`Deleted <b>${data.redis?.count ?? 0}</b> cache keys`);
    });

    Button.build(panels.cache.backup.element.querySelector('button#backup')).handle(async () => {
      const { data } = await context.services.io.exec('cache:backup');

      const link = document.createElement('a');
      const date = new Date();

      link.download = `mock-server-cache-backup-${date.toLocaleDateString()}-${date.getTime()}.txt`;
      link.href = URL.createObjectURL(new Blob([data], { type: 'text' }));

      link.click();
    });

    Button.build(panels.cache.restoration.element.querySelector('button#restore')).handle(async () => {
      const extracted = await storages.cache.restoration.save();
      if (!extracted.files?.length) {
        return context.shared.popups.push('File is not provided', { level: 'warning' });
      }

      const size = 1024 * 300;
      const stream = socketIoStream.createStream({ highWaterMark: size });

      socketIoStream(context.instances.io).emit('cache:restore:stream', stream, { ttl: extracted.ttl });
      socketIoStream.createBlobReadStream(extracted.files[0].source, { highWaterMark: size }).pipe(stream);

      await new Promise((resolve) => stream.once('finish', resolve));
      context.shared.popups.push('Restored');
    });

    panels.visual.pathSize.on('enable', (button) => context.services.settings.assign('settings:visual:path-size', button.name));
  })
  .on('select', async () => {
    const { data } = await context.services.io.exec('stats');
    panels.system.stats.replace(templates.stats(data));
  });
