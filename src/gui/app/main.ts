import '../../extensions';

import * as components from './components';
import * as sections from './sections';

import handlebars from './handlebars';
import context from './context';

handlebars.init();

const loader = components.LoaderComponent.build().show();
const header = components.HeaderComponent
  .build([
    { type: 'section', entity: sections.settings.hide() },
    { type: 'section', entity: sections.analytics.hide() },
    { type: 'separator' },
    { type: 'section', entity: sections.expectations },
    { type: 'section', entity: sections.history.hide() },
  ])
  .on('select', (section) => {
    Object.values(header.sections).forEach((nested) => nested.hide());

    context.switchStorage(section.storage);
    section.show().select();
  });

context
  .switchStorage(sections.expectations.storage)
  .share({
    popups: components.PopupsComponent.build(),
    groups: new Set(),
  });

document.body.prepend(header.element);
document.body.append(loader.element);
document.body.append(context.shared.popups.element);

Object.values(sections).forEach((section) => document.body.append(section.element));

context.instances.io.on('connect', async () => {
  console.log('WebSocket has connected');

  await context.services.io.exec('ping');

  const { data } = await context.services.io.exec('config:get');

  context.assignConfig(data);
  context.shared.popups.push('Connected!');

  Object.values(sections).forEach((container) => container.initialize());
  loader.hide();
});
