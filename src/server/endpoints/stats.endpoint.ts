import { version } from '../../../package.json';
import { Endpoint } from '../models';

export default Endpoint
  .build<{ outgoing: { version: string } }>()
  .bindToHttp(<const>{ method: 'GET', path: '/stats' })
  .assignHandler(async (context) => context.reply.ok({ version }))
  .compile();
