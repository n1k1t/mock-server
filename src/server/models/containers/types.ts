export interface IContainerConfiguration<T extends object> {
  key: string | object;
  payload: T;

  /** Seconds */
  ttl?: number;
  prefix?: string;
}
