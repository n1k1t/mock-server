import { IPopupComponentOptions, PopupComponent } from '../popup.component';

const containerElement = document.querySelector('div.popups-container');

export class PopupsContainerComponent extends PopupComponent {
  public push(message: string, options: IPopupComponentOptions = {}) {
    const element = this.buildElement(message, options);

    containerElement?.prepend(element);
    setTimeout(() => element?.remove(), 1000);
  }
}

export const popupsContainerComponent = new PopupsContainerComponent();
