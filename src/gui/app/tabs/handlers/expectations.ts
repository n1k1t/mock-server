import { emptyPlaceholderComponent, expectationRowComponent } from '../../components';
import { getSelectedTab } from '../utils';

import context from '../../context';

context.services.ws.subscribe('expectation:added', (expectation) => {
  if (getSelectedTab() !== 'expectations') {
    return null;
  }

  const { tabContainer } = context.elements;

  tabContainer.querySelector('div.empty-placeholder')?.remove();
  tabContainer.prepend(expectationRowComponent.buildElement(expectation));
});

context.services.ws.subscribe('expectation:updated', (expectation) => {
  if (getSelectedTab() !== 'expectations') {
    return null;
  }

  const { tabContainer } = context.elements;
  const rowElement = tabContainer.querySelector(`div.row[id="${expectation.id}"]`);

  rowElement?.before(expectationRowComponent.buildElement(expectation));
  rowElement?.remove();
});

export default async () => {
  const { tabContainer } = context.elements;

  tabContainer.innerHTML = '';

  const { data } = await context.services.ws.exec('expectations:get');
  if (!data.length) {
    return tabContainer.append(emptyPlaceholderComponent.buildElement());
  }

  data.forEach((expectation) => tabContainer.append(expectationRowComponent.buildElement(expectation)));
}
