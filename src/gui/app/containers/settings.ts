import { Container } from '../models';
import context from '../context';

export default Container
  .build(document.querySelector('section#settings')!)
  .on('select', async () => {
    context.shared.settings.refresh();
  })
  .on('initialize', () => {
    context.shared.settings.resetFilters();
    context.shared.settings.refresh();
  })
  .once('initialize', (container) => {
    container.append(context.shared.settings);
  });
