import { Component } from '../models';

interface ICurtainComponentOptions {
  isPreventedToManualClose?: boolean;
}

export class CurtainComponent extends Component {
  constructor(public options: ICurtainComponentOptions = {}) {
    super('<div class="curtain hidden"></div>');

    if (!options.isPreventedToManualClose) {
      this.element.addEventListener('click', (event) => event.target === this.element ? this.hide() : null);
    }
  }

  static build(options: ICurtainComponentOptions) {
    return new CurtainComponent(options);
  }
}
