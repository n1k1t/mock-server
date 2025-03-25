import { IDevContext } from './dev';

declare global {
  interface Window {
    DEV?: IDevContext;
  }
}

export {}
