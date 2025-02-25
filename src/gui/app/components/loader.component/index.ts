import { CurtainComponent } from '../curtain.component';

export class LoaderComponent extends CurtainComponent {
  constructor() {
    super({ isPreventedToManualClose: true });
    this.append('<div><p>Ping pong</p><div class="loader"></div></div>').assignId('loader');
  }

  static build() {
    return new LoaderComponent();
  }
}
