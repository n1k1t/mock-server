import Chart from 'chart.js/auto';

import _clamp from 'lodash/clamp';
import _unset from 'lodash/unset';

import { IPanelConfiguration, PanelComponent, TPanelSize } from '../panel.component';
import { buildCounter, cast } from '../../../../utils/common';
import { calculateColor } from '../../utils';
import { Component } from '../../models';

interface IPoint {
  legend: string;
  values: Record<string, number>;
}

const calculateLegendsLimit = (size: TPanelSize) => cast<Record<TPanelSize, number>>({
  L: 20,
  M: 10,
  S: 7,
  XS: 5,
})[size];

const calculatePointsLimit = (size: TPanelSize) => cast<Record<TPanelSize, number>>({
  L: 200,
  M: 100,
  S: 60,
  XS: 40,
})[size];

export class ChartComponent extends Component {
  private counter = buildCounter();

  private aliases: Record<string, number> = {};
  private stack: number[] = [];

  private points = new Map<number, IPoint>();
  private labels = new Set<string>();

  private limits = {
    legend: calculateLegendsLimit(this.provided.width ?? 'L'),
    point: this.provided.limit ?? calculatePointsLimit(this.provided.width ?? 'L'),
  };

  private source = new Chart(document.createElement('canvas'), {
    type: 'line',
    data: {
      labels: cast<string[]>([]),
      datasets: [],
    },

    options: {
      scales: {
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
          },

          ticks: {
            maxTicksLimit: this.limits.legend * 2,
          },
        },

        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
          },

          ticks: {
            maxTicksLimit: this.limits.legend,
          },
        },
      },

      plugins: {
        legend: {
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',

            boxHeight: 5,
            boxWidth: 5,
          },
        },
      },
    },
  });

  private panel = PanelComponent.build({ ...this.provided, class: 'chart' }).replace(this.source.canvas);

  constructor(private provided: IPanelConfiguration & {
    mode?: 'aggregation';
    limit?: number;
  }) {
    super();
    this.replace(this.panel);
  }

  public provide(points: IPoint[]) {
    points.forEach((point) => {
      if (this.provided.mode === 'aggregation') {
        const id = this.aliases[point.legend] ?? this.counter();
        const target = this.points.get(id) ?? cast<IPoint>({ legend: point.legend, values: {} });

        if (!this.aliases[point.legend]) {
          this.aliases[point.legend] = id;

          this.points.set(id, target);
          this.stack.push(id);
        }

        return Object.entries(point.values).forEach(([label, value]) => {
          target.values[label] = (target.values[label] ?? 0) + value;
          this.labels.add(label);
        });
      }

      const id = this.counter();

      this.stack.push(id);
      this.points.set(id, point);

      Object.keys(point.values).forEach((label) => this.labels.add(label));
    });

    this.stack.slice(0, _clamp(this.stack.length - this.limits.point, 0, Infinity)).forEach((id) => {
      const point = this.points.get(id);
      if (point) {
        _unset(this.aliases, point.legend);
      }

      this.points.delete(id);
      this.stack.shift();
    });

    const iterated = [...this.points.values()];

    this.source.data = {
      labels: iterated.map((point) => point.legend),

      datasets: [...this.labels.values()].map((label) => ({
        label,
        data: Array(iterated.length).fill(null).map((value, index) => iterated[index].values[label] ?? null),

        tension: 0.3,
        pointRadius: 2,

        pointHitRadius: 20,
        pointHoverRadius: 5,

        borderWidth: 1,
        borderColor: calculateColor(label),
        backgroundColor: calculateColor(label),
      })),
    };

    this.source.update('none');
    return this;
  }

  public clear(): this {
    this.source.reset();

    this.points.clear();
    this.labels.clear();

    this.aliases = {};
    this.stack = [];

    return this;
  }

  static build(provided: ChartComponent['provided']) {
    return new ChartComponent(provided);
  }
}
