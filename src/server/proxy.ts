import createHttpsProxyAgent from 'https-proxy-agent';
import { createProxyServer } from 'http-proxy';

interface IProxyOptions {
  host?: string
  port: number
  targetHost: string
  useHostHeaderRewriting?: boolean
};

export const startHttpProxy = ({ host, port, targetHost, useHostHeaderRewriting }: IProxyOptions) =>
  createProxyServer({
    target: targetHost,
    agent: createHttpsProxyAgent(host ?? 'localhost'),
    changeOrigin: useHostHeaderRewriting
  }).listen(port);
