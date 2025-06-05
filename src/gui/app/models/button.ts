import { TFunction } from '../../../../types';

export class Button {
  private handlers: TFunction<Promise<unknown>, [Event]>[] = [];

  constructor(public element?: Element | null) {
    if (!element) {
      throw new Error('Provided element is not valid');
    }

    element.addEventListener('click', (event) => this.trigger(event));
  }

  public handle(handler: TFunction<Promise<unknown> | unknown, [Event]>) {
    if (!this.element) {
      return this;
    }

    this.handlers.push(async (event) => {
      this.element!.classList.add('processed');

      try {
        await handler(event);
      } finally {
        this.element!.classList.remove('processed');
      }
    });

    return this;
  }

  async trigger(event = new Event('manual')) {
    for (const handler of this.handlers) {
      await handler(event)
    }
  }

  static build(element?: Button['element']) {
    return new Button(element);
  }
}
