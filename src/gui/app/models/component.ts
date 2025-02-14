export class Component {
  public element: Element = document.createElement('div');

  constructor(element?: Element | string) {
    if (element) {
      this.element = typeof element === 'string' ? this.compileHtmlStringToElement(element) : element;
    }
  }

  public get isHidden(): boolean {
    return this.element.classList.contains('hidden');
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

  public append(element: Component | Element | string) {
    if (element instanceof Component) {
      this.element.append(element.element);
      return this;
    }

    this.element.append(typeof element === 'string' ? this.compileHtmlStringToElement(element) : element);
    return this;
  }

  public prepend(element: Component | Element | string) {
    if (element instanceof Component) {
      this.element.prepend(element.element);
      return this;
    }

    this.element.prepend(typeof element === 'string' ? this.compileHtmlStringToElement(element) : element);
    return this;
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
