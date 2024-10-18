import _unset from 'lodash/unset';
import _set from 'lodash/set';

import { getSelectedTab } from '../utils';
import { emptyPlaceholderComponent, historyRecordRowComponent } from '../../components';

import context from '../../context';

context.webSocket.subscribe('history:added', (historyRecord) => {
  if (getSelectedTab() !== 'history') {
    return null;
  }

  const { tabContainer } = context.elements;

  tabContainer.querySelector('div.empty-placeholder')?.remove();
  tabContainer.prepend(historyRecordRowComponent.buildElement(historyRecord));

  if ((tabContainer.childNodes.length ?? 0) > context.config.historyRecordsLimit) {
    const historyRecordElementToRemove = tabContainer.lastChild;
    const historyRecordCacheToRemove = Object
      .values(context.cache.historyRecords)
      .find(({ element }) => element === historyRecordElementToRemove)

    historyRecordElementToRemove?.remove();
    _unset(context.cache.historyRecords, historyRecordCacheToRemove?.id ?? 'unknown');
  }
});

context.webSocket.subscribe('history:updated', (historyRecord) => {
  if (getSelectedTab() !== 'history') {
    return null;
  }

  const { tabContainer } = context.elements;
  const rowElement = tabContainer.querySelector(`div.row[id="${historyRecord.id}"]`);

  rowElement?.before(historyRecordRowComponent.buildElement(historyRecord));
  rowElement?.remove();
});

export default async () => {
  const { tabContainer } = context.elements

  tabContainer.innerHTML = '';

  const { data } = await context.webSocket.exec('history:get', {});
  if (!data.length) {
    return tabContainer.append(emptyPlaceholderComponent.buildElement());
  }

  const receivedHistoryIds = data.map(({ id }) => id);
  const actualHistoryRecords = data
    .map((historyRecord) => ({
      id: historyRecord.id,
      createdAt: historyRecord.meta.requestedAt,
      element: historyRecordRowComponent.buildElement(historyRecord),
    }));

  Object.keys(context.cache.historyRecords)
    .filter((id) => receivedHistoryIds.includes(id) == false)
    .forEach((id) => _unset(context.cache.historyRecords, id));

  const resultHistoryRecords = actualHistoryRecords
    .filter(({ id }) => !context.cache.historyRecords[id]?.element)
    .concat(Object.values(context.cache.historyRecords))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, context.config.historyRecordsLimit);

  resultHistoryRecords.forEach(({ element }) => tabContainer.append(element));
  context.cache.historyRecords = resultHistoryRecords.reduce((acc, record) => _set(acc, record.id, record), {});
}
