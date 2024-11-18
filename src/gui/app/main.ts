import _omit from 'lodash/omit';
import _set from 'lodash/set';
import _unset from 'lodash/unset';

import { initTabsPanel } from './tabs';
import { initHandlebars } from './handlebars';

import context from './context';

initHandlebars();

context.instances.ws.on('connect', async () => {
  console.log('WebSocket has connected');

  await context.services.ws.exec('ping');

  const { data } = await context.services.ws.exec('config:get');
  Object.assign(context, { config: data });

  initTabsPanel();
});
