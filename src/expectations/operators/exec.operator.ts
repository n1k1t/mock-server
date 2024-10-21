import _ from 'lodash';
import { buildExpectationOperatorHandler } from './utils';

const arrowFunctionRegExp = /^\([^)]*\)\s*=>/;

export default buildExpectationOperatorHandler<'$exec'>(
  (mode, command, context) => {
    if (mode !== 'manipulation') {
      return true;
    }

    const parameters = { _, context };
    const fn = typeof command === 'function'
      ? command
      : Function('{ _, context }', `${arrowFunctionRegExp.test(command.trim()) ? 'return' : ''} ${command}`);

    const handled = fn(parameters);
    if (typeof handled === 'function') {
      handled(parameters);
    }

    return true;
  }
);
