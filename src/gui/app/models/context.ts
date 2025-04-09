import { DynamicStorage } from './dynamic-storage';

export class Context<TShared extends object = {}> {
  public storage = DynamicStorage.build('void', document.body);
  public shared = <TShared>{};

  public share(shared: TShared) {
    return Object.assign(this, { shared });
  }

  public switchStorage(storage: DynamicStorage<any>) {
    return Object.assign(this, { storage });
  }
}
