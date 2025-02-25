export class ClientStorage<T extends object = object> {
  constructor(public key: string) {}

  public extract(): T | null {
    return JSON.parse(localStorage.getItem(this.key) ?? 'null');
  }

  public store(value: T): this {
    localStorage.setItem(this.key, JSON.stringify(value));
    return this;
  }

  public clear(): this {
    localStorage.removeItem(this.key);
    return this;
  }

  static build<T extends object>(key: string) {
    return new ClientStorage<T>(key);
  }
}
