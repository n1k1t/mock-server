import dayjs from 'dayjs';
import hbs from 'handlebars';

import { ChartComponent } from '../../components';
import { Section } from '../../models';

import context from '../../context';

const template = hbs.compile(require('./template.hbs'));

const charts = {
  memory: ChartComponent.build({
    title: 'Server memory usage',
    icon: 'fas fa-memory',

    description: 'updates every 5 seconds',
    width: 'M',
  }),

  cache: ChartComponent.build({
    title: 'Cache memory usage',
    icon: 'fas fa-database',

    description: 'updates every 10 minutes',
    width: 'M',
  }),

  containers: ChartComponent.build({
    title: 'Registered containers',
    icon: 'fas fa-box',

    description: 'updates every 5 seconds',
    width: 'S',
  }),

  rate: ChartComponent.build({
    title: 'Requests rate',
    icon: 'fas fa-rocket',
    mode: 'aggregation',

    description: 'updates instantly',
    width: 'S',
  }),
};

export default Section
  .build(template({}))
  .assignMeta({ icon: 'fas fa-chart-line' })
  .once('initialize', (section) => {
    section.content.append(charts.memory);
    section.content.append(charts.cache);

    section.content.append(charts.containers);
    section.content.append(charts.rate);

    context.services.io.subscribe('metric:registered', ({ name, point: { timestamp, values } }) =>
      name in charts
        ? charts[<keyof typeof charts>name].provide([{ values, legend: dayjs(timestamp).format('HH:mm') }])
        : null
    );
  })
  .on('initialize', async () => {
    charts.containers.clear();
    charts.memory.clear();
    charts.cache.clear();
    charts.rate.clear();

    const { data } = await context.services.io.exec('metrics:get');

    charts.memory.provide(
      data.memory.map(({ timestamp, values }) => ({ values, legend: dayjs(timestamp).format('HH:mm') }))
    );

    charts.cache.provide(
      data.cache.map(({ timestamp, values }) => ({ values, legend: dayjs(timestamp).format('HH:mm') }))
    );

    charts.rate.provide(
      data.rate.map(({ timestamp, values }) => ({ values, legend: dayjs(timestamp).format('HH:mm') }))
    );

    charts.containers.provide(
      data.containers.map(({ timestamp, values }) => ({ values, legend: dayjs(timestamp).format('HH:mm') }))
    );
  });
