import _ from 'lodash';
import { Middleware } from '../models';

export default Middleware
  .build(__filename, ['expectation'])
  .assignHandler((context) =>
    context.share({ snapshot: context.shared.expectation.request.manipulate(context.shared.snapshot) })
  );
