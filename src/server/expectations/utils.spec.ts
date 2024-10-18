import { buildExpectationContext } from './__utils__';
import { IExpectationSchema } from './types';
import { exploreNestedExpectationSchema } from './utils';

describe('Expectations.Utils', () => {
  it('should validate by expectation schema', () => {
    const context = buildExpectationContext()
    const schema: IExpectationSchema = {
      $and: [
        {
          $has: {
            $location: 'statusCode',
            $value: 200,
          },
        },
        {
          $has: {
            $location: 'query',
            $path: 'bar.baz',
            $value: null,
          },
        },
      ],
    };

    expect(exploreNestedExpectationSchema('validation', schema, context)).toBeTruthy();
  });

  it('should manipulate by expectation schema', () => {
    const context = buildExpectationContext()
    const schema: IExpectationSchema = {
      $if: {
        $and: [
          {
            $has: {
              $location: 'statusCode',
              $value: 200,
            },
          },
          {
            $has: {
              $location: 'query',
              $path: 'bar.baz',
              $value: null,
            },
          },
        ],

        $then: {
          $set: {
            $location: 'query',
            $path: 'bar.baz',
            $value: true,
          },
        },
      },
    };

    exploreNestedExpectationSchema('manipulation', schema, context);
    expect((<any>context.query).bar.baz).toBeTruthy();
  });
})
