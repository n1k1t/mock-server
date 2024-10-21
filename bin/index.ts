import { program } from 'commander';
import _ from 'lodash';

import { name, version, description } from '../package.json';
import { MockServer } from '../src';

program
  .name(name)
  .version(version)
  .description(description)
  .option('-h, --host <string>', 'Mock server host', 'localhost')
  .option('-p, --port <number>', 'Mock server port')
  .parse();

const validate = <T>(name: string, value: T, validator: (...args: unknown[]) => boolean): T => {
  if (!validator(value)) {
    console.error(`Option "${name}" is not valid!`);
    process.exit(1);
  }

  return value;
}

(async () => {
  const options = program.opts();

  await MockServer.start({
    host: validate<string>('host', options.host, _.isString),
    port: validate<number>('port', Number(options.port), Number.isInteger),
  });
})();
