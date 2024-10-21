import path from 'path';

const checkIsTypeScriptRuntime = (): boolean => path.parse(__filename).ext === '.ts';
const getPathToRoot = (): string => path.resolve(__dirname, checkIsTypeScriptRuntime() ? '' : '../', '../../');

export default {
  client: {
    publicDirPath: path.resolve(getPathToRoot(), 'public'),
    publicRoute: '/_mock/gui',
  },

  server: {
    historyRecordsLimit: 100,
  },
};
