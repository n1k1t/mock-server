import hbs from 'handlebars';

import * as helpers from './helpers';
import * as partials from './partials';

export default {
  init: () => {
    Object.entries(helpers).forEach(([name, helper]) => hbs.registerHelper(name, helper));
    Object.entries(partials).forEach(([name, partial]) => hbs.registerPartial(name, partial));
  },
}
