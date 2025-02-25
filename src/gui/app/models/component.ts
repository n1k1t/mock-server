export class Component {
  public element: Element = document.createElement('div');

  constructor(predicate?: Element | string) {
    if (predicate) {
      this.element = typeof predicate === 'string' ? this.compileHtmlStringToElement(predicate) : predicate;
    }
  }

  public get isHidden(): boolean {
    return this.element.classList.contains('hidden');
  }

  public get id(): string {
    return this.element.id;
  }

  public assignId(id: string) {
    this.element.id = id;
    return this;
  }

  public show() {
    this.element.classList.remove('hidden');
    return this;
  }

  public hide() {
    this.element.classList.add('hidden');
    return this;
  }

  public append(predicate: Component | Element | string) {
    this.element.append(
      predicate instanceof Component
        ? predicate.element
        : typeof predicate === 'string'
          ? this.compileHtmlStringToElement(predicate)
          : predicate
    );

    return this;
  }

  public prepend(predicate: Component | Element | string) {
    this.element.prepend(
      predicate instanceof Component
        ? predicate.element
        : typeof predicate === 'string'
          ? this.compileHtmlStringToElement(predicate)
          : predicate
    );

    return this;
  }

  public replace(predicate: Component | Element | string) {
    const element = predicate instanceof Component
      ? predicate.element
      : typeof predicate === 'string'
        ? this.compileHtmlStringToElement(predicate)
        : predicate;

    this.element.after(element);

    if (this.isHidden) {
      element.classList.add('hidden');
    }

    return Object.assign(this.delete(), { element });
  }

  public clear() {
    this.element.innerHTML = '';
    return this;
  }

  public delete() {
    this.element.remove();
    return this;
  }

  public compileHtmlStringToElement(content: string): Element {
    return new DOMParser().parseFromString(content, 'text/html').body.firstElementChild!;
  }
}
