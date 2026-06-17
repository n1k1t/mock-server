import _ from 'lodash';

import { Service } from '../models';
import { cast } from '../../utils';

export class ShutdownService extends Service {
  public state = {
    status: cast<'HEALTHY' | 'EXITING'>('HEALTHY'),
  };

  public async exit(): Promise<void> {
    if (this.state.status === 'EXITING') {
      return new Promise(() => null);
    }

    this.state.status = 'EXITING';

    await Promise.allSettled([
      this.server.services.containers.backup(),
      this.server.services.history.backup(),
    ]);

    process.exit(0);
  }

  static build(server: Service['server']) {
    return new ShutdownService(server);
  }
}
