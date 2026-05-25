export interface IContainerConfiguration<T extends object> {
  key: string | object;
  payload: T;

  /** Seconds */
  ttl?: number;
}

export interface IContainersStorageDump {
  payloads: object[];

  containers: {
    key: string;
    group: string;

    ttl: number;
    payload: number;
  }[];
}
