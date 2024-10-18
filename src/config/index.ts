import path from 'path';

const checkIsTypeScriptRuntime = (): boolean => path.parse(__filename).ext === '.ts';
const getPathToRoot = (): string => path.resolve(__dirname, checkIsTypeScriptRuntime() ? '' : '../', '../../');

export const clientConfig = {
  publicDirPath: path.resolve(getPathToRoot(), 'public'),
  publicRoute: '/_mock/gui',
};

export const serverConfig = {
  historyRecordsLimit: 100,
};
