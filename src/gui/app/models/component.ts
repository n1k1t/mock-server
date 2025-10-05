export type TElementPredicate = Component | Element | string | null;

export class Component {
  public element: Element = document.createElement('div');

  constructor(predicate?: TElementPredicate) {
    if (predicate) {
      this.element = this.compilePredicateToElement(predicate);
    }
  }

  public get isHidden(): boolean {
    return this.element.classList.contains('hidden');
  }

  public get id(): string {
    return this.element.id;
  }

  public identify(id: string): this {
    this.element.id = id;
    return this;
  }

  public show(): this {
    this.element.classList.remove('hidden');
    return this;
  }

  public hide(): this {
    this.element.classList.add('hidden');
    return this;
  }

  public append(predicate: TElementPredicate): this {
    this.element.append(this.compilePredicateToElement(predicate));
    return this;
  }

  public prepend(predicate: TElementPredicate): this {
    this.element.prepend(this.compilePredicateToElement(predicate));
    return this;
  }

  public replace(predicate: TElementPredicate): this {
    const element = this.compilePredicateToElement(predicate);
    this.element.after(element);

    if (this.isHidden) {
      element.classList.add('hidden');
    }

    return Object.assign(this.delete(), { element });
  }

  public clear(): this {
    this.element.innerHTML = '';
    return this;
  }

  public delete(): this {
    this.element.remove();
    return this;
  }

  protected compilePredicateToElement(predicate: TElementPredicate): Element {
    return predicate instanceof Component
      ? predicate.element
      : typeof predicate === 'string'
      ? this.compileHtmlStringToElement(predicate)
      : predicate === null
      ? document.createElement('div')
      : predicate;
  }

  protected compileHtmlStringToElement(content: string): Element {
    return new DOMParser().parseFromString(content, 'text/html').body.firstElementChild!;
  }
}
