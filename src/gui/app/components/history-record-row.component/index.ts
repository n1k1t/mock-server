import JsonFormatHighlight from '../../../../../../json-formatter';
import _pick from 'lodash/pick';
import hbs from 'handlebars';

import type { History } from '../../../../server/history';

import { popupsContainerComponent } from '../popups-container.component';
import { Component } from '../../models';

const template = require('./template.hbs');
const render = hbs.compile(template);

export class HistoryRecordRowComponent extends Component {
  public buildElement(history: History): Element {
    const { request, request: response, forwaded, expectation } = history;

    const element = Object.assign(
      this.compileHtmlStringToElement(
        render(Object.assign(history, {
          ...((!response && !expectation) && {
            response: { statusCode: 404},
          }),
        }))
      ),
      { id: history.id }
    );

    const jsonContainerElement = element.querySelector('pre');

    element.addEventListener('click', (event: Event) => {
      if (event.composedPath().some((element) => (<Element>element)?.classList?.contains('meta')) === false) {
        return null;
      }

      if (element.querySelector('pre div.json-formatter-row') === null) {
        const jsonComponent = new JsonFormatHighlight(
          Object.assign(_pick(history, ['error']), {
            request: Object.assign(_pick(request, ['path', 'method', 'headers']), {
              ...(request.bodyRaw.length && { body: request.bodyRaw }),
              ...(Object.keys(request.query ?? {}).length && { query: request.query }),
              ...(Object.keys(request.body ?? {}).length && { body: request.body }),
            }),

            ...(response && {
              response: Object.assign(_pick(response, ['statusCode', 'headers']), {
                ...(response?.dataRaw?.length && { data: response.dataRaw }),
                ...(Object.keys(response?.data ?? {}).length && { data: response?.data }),
              })
            }),

            ...(forwaded && {
              forwarded: {
                request: Object.assign(_pick(forwaded.request, ['path', 'method', 'headers']), {
                  ...(forwaded.request.bodyRaw.length && { body: forwaded.request.bodyRaw }),
                  ...(Object.keys(forwaded.request.query ?? {}).length && { query: forwaded.request.query }),
                  ...(Object.keys(forwaded.request.body ?? {}).length && { body: forwaded.request.body }),
                }),

                ...(forwaded.response && {
                  response: Object.assign(_pick(forwaded.response, ['statusCode', 'headers']), {
                    ...(forwaded.response?.dataRaw?.length && { data: forwaded.response.dataRaw }),
                    ...(Object.keys(forwaded.response?.data ?? {}).length && { data: forwaded.response?.data }),
                  }),
                })
              },
            }),
          }),
          2,
          {
            theme: 'custom',
            afterCopyHandler: () => popupsContainerComponent.push('Copied!', { icon: 'fas fa-clone', level: 'info' }),
          }
        );

        jsonContainerElement?.appendChild(jsonComponent.render());
      }

      jsonContainerElement?.classList.toggle('hidden');
    });

    return element;
  }
}

export const historyRecordRowComponent = new HistoryRecordRowComponent();
