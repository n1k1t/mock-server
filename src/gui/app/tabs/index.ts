import * as handlers from './handlers';
import context from '../context';

export * from './utils';

type TTabHandlerName = keyof typeof handlers;

export const initTabsPanel = () => {
  const { tabsPanel } = context.elements;
  const currentTab = tabsPanel.querySelector(`.tab:has(a[href="${location.hash}"])`) ?? tabsPanel.querySelector('.tab');

  currentTab?.classList?.add('selected');
  handlers[<TTabHandlerName>(currentTab?.querySelector('a')?.getAttribute('href') ?? '').substring(1)]?.();

  tabsPanel.addEventListener('click', (event) => {
    const tabElement = (<Element[]>event.composedPath()).find((element) => element.classList?.contains('tab'));
    const anchorElement = (<Element[]>event.composedPath()).find((element) => element?.hasAttribute('href'));

    if (!tabElement || !anchorElement || tabElement.classList.contains('selected')) {
      return null;
    }

    tabsPanel
      .querySelectorAll('.tab.selected')
      .forEach((element) => element.classList.remove('selected'));

    tabElement.classList.add('selected');

    handlers[<TTabHandlerName>(anchorElement?.getAttribute('href') ?? '').substring(1)]?.();
  });
}
