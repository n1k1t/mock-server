import { HelperOptions } from 'handlebars';

export const buildHandlebarsHelper = <T extends unknown[]>(
  handler: (context: object) => (...args: [...T, HelperOptions]) => unknown
) => {
  return function(this: object, ...args: [...T, HelperOptions]) {
    return handler(this)(...args);
  }
}
