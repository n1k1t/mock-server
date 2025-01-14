import { Container } from '../models';
import context from '../context';

const container = Container
  .build(document.querySelector('section#settings')!)
  .on('select', async () => {
    context.shared.settings.refresh();
  })
  .on('initialize', () => {
    context.shared.settings.resetFilters();
    context.shared.settings.refresh();
  })
  .once('initialize', () => {
    container.append(context.shared.settings);
  });

export default container;
