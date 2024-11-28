import _unset from 'lodash/unset';
import _omit from 'lodash/omit';
import _set from 'lodash/set';

import { PopupsComponent } from './components';
import * as containers from './containers';

import handlebars from './handlebars';
import context from './context';

handlebars.init();

const switchButtonIdToContainerElementMap = {
  'switch-to-expectations-container': containers.expectations.hide(),
  'switch-to-history-container': containers.history.hide(),
};

context
  .switchStorage(containers.expectations.storage)
  .share({ popups: PopupsComponent.build() });

document.body.append(context.shared.popups.element);
document.querySelector('div#container-select')!.addEventListener('click', (source) => {
  const event = <Event & { target: Element }>source;
  if (event.target?.nodeName !== 'BUTTON') {
    return null;
  }

  event.target.parentNode?.querySelectorAll('button.checked').forEach((element) => element.classList.remove('checked'));
  event.target.classList.add('checked');

  Object.values(switchButtonIdToContainerElementMap).forEach((container) => container.hide());

  const container = switchButtonIdToContainerElementMap[
    <keyof typeof switchButtonIdToContainerElementMap>event.target.id
  ];

  container.show().initialize();
  context.switchStorage(container.storage);
});

context.instances.ws.on('connect', async () => {
  console.log('WebSocket has connected');

  await context.services.ws.exec('ping');

  const { data } = await context.services.ws.exec('config:get');

  context.assignConfig(data);
  containers.expectations.initialize().show();
});
