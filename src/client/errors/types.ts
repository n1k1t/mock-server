import { AxiosRequestConfig } from 'axios';

export interface IRequestConfiguration extends Pick<AxiosRequestConfig, 'baseURL' | 'url' | 'method'> {}
