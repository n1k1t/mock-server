import hbs from 'handlebars';
import { Section } from '../../models';

const template = require('./template.hbs');
const render = hbs.compile(template);

export default Section
  .build(render({}))
  .assignMeta({ icon: 'fas fa-chart-line' });
