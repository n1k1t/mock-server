import _ from 'lodash';
import { program } from 'commander';

import { name, version, description } from '../package.json';
import { startMockServer } from './index';

program
  .name(name)
  .version(version)
  .description(description)
  .option('-h, --host <string>', 'Host')
  .option('-p, --port <number>', 'Port')
  .parse();

const handleOption = <T>(name: string, value: T, validator: (...args: unknown[]) => boolean): T => {
  if (!validator(value)) {
    console.error(`Option "${name}" is not valid!`);
    process.exit(1);
  }

  return value;
}

const bootstrap = async () => {
  const { host, port } = program.opts();

  const serverConfig = {
    host: handleOption<string>('host', host, _.isString),
    port: handleOption<number>('port', Number(port), Number.isInteger)
  }

  await startMockServer(serverConfig);
}

bootstrap();
