export abstract class Component {
  public abstract buildElement(...args: unknown[]): Element;

  protected compileHtmlStringToElement(content: string): Element {
    return new DOMParser().parseFromString(content, 'text/html').body.firstElementChild!;
  }
}
