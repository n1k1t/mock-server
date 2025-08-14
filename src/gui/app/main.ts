import * as components from './components';
import * as sections from './sections';

import context from './context';

const loader = components.LoaderComponent.build().show();
const header = components.HeaderComponent.build([
  { type: 'section', entity: sections.settings.hide() },
  { type: 'section', entity: sections.analytics.hide() },
  { type: 'separator' },
  { type: 'section', entity: sections.expectations },
  { type: 'section', entity: sections.history.hide() },
]);

context.switchStorage(sections.expectations.storage).share({
  popups: components.PopupsComponent.build(),
});

document.body.prepend(header.element);
document.body.append(loader.element);
document.body.append(context.shared.popups.element);

Object
  .values(sections)
  .map((section) => section.compile())
  .forEach((section) => document.body.append(section.element));

context.instances.io.on('connect', async () => {
  console.log('WebSocket has connected');

  await context.services.io.exec('ping');

  const { data } = await context.services.io.exec('config:get');

  context.services.config.assign(data);
  context.shared.popups.push('Connected!');

  Object.values(sections).forEach((container) => container.initialize());
  loader.hide();
});
