import type { MockServer } from '../index';

export abstract class Service {
  constructor(protected server: MockServer<any, any>) {}
}
