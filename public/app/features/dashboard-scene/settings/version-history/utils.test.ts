import { type Dashboard } from '@grafana/schema';
import * as ResponseTransformers from 'app/features/dashboard/api/ResponseTransformers';

import { type Diff, getDiffOperationText, getDiffText, jsonDiff, panelDiff } from './utils';

describe('getDiffOperationText', () => {
  const cases = [
    ['add', 'added'],
    ['remove', 'deleted'],
    ['replace', 'changed'],
    ['byDefault', 'changed'],
  ];

  test.each(cases)('it returns the correct verb for an operation', (operation, expected) => {
    expect(getDiffOperationText(operation)).toBe(expected);
  });
});

type DiffTextCase = [Partial<Diff>, string];
describe('getDiffText', () => {
  const addEmptyArray: DiffTextCase = [
    { op: 'add', value: [], path: ['annotations', 'list'], startLineNumber: 24 },
    'added list',
  ];
  const addArrayNumericProp: DiffTextCase = [
    {
      op: 'add',
      value: ['tag'],
      path: ['panels', '3'],
    },
    'added item 3',
  ];
  const addArrayProp: DiffTextCase = [
    {
      op: 'add',
      value: [{ name: 'dummy target 1' }, { name: 'dummy target 2' }],
      path: ['panels', '3', 'targets'],
    },
    'added 2 targets',
  ];
  const addValueNumericProp: DiffTextCase = [
    {
      op: 'add',
      value: 'foo',
      path: ['panels', '3'],
    },
    'added item 3',
  ];
  const addValueProp: DiffTextCase = [
    {
      op: 'add',
      value: 'foo',
      path: ['panels', '3', 'targets'],
    },
    'added targets',
  ];

  const removeEmptyArray: DiffTextCase = [
    { op: 'remove', originalValue: [], path: ['annotations', 'list'], startLineNumber: 24 },
    'deleted list',
  ];
  const removeArrayNumericProp: DiffTextCase = [
    {
      op: 'remove',
      originalValue: ['tag'],
      path: ['panels', '3'],
    },
    'deleted item 3',
  ];
  const removeArrayProp: DiffTextCase = [
    {
      op: 'remove',
      originalValue: [{ name: 'dummy target 1' }, { name: 'dummy target 2' }],
      path: ['panels', '3', 'targets'],
    },
    'deleted 2 targets',
  ];
  const removeValueNumericProp: DiffTextCase = [
    {
      op: 'remove',
      originalValue: 'foo',
      path: ['panels', '3'],
    },
    'deleted item 3',
  ];
  const removeValueProp: DiffTextCase = [
    {
      op: 'remove',
      originalValue: 'foo',
      path: ['panels', '3', 'targets'],
    },
    'deleted targets',
  ];
  const replaceValueNumericProp: DiffTextCase = [
    {
      op: 'replace',
      originalValue: 'foo',
      value: 'bar',
      path: ['panels', '3'],
    },
    'changed item 3',
  ];
  const replaceValueProp: DiffTextCase = [
    {
      op: 'replace',
      originalValue: 'foo',
      value: 'bar',
      path: ['panels', '3', 'targets'],
    },
    'changed targets',
  ];

  const cases = [
    addEmptyArray,
    addArrayNumericProp,
    addArrayProp,
    addValueNumericProp,
    addValueProp,
    removeEmptyArray,
    removeArrayNumericProp,
    removeArrayProp,
    removeValueNumericProp,
    removeValueProp,
    replaceValueNumericProp,
    replaceValueProp,
  ];

  test.each(cases)(
    'returns a semantic message based on the type of diff, the values and the location of the change',
    (diff: Partial<Diff>, expected: string) => {
      expect(getDiffText(diff as unknown as Diff)).toBe(expected);
    }
  );
});

describe('jsonDiff', () => {
  it('returns data related to each change', () => {
    const lhs = {
      annotations: {
        list: [
          {
            builtIn: 1,
            datasource: '-- Grafana --',
            enable: true,
            hide: true,
            iconColor: 'rgba(0, 211, 255, 1)',
            name: 'Annotations & Alerts',
            type: 'dashboard',
          },
        ],
      },
      editable: true,
      gnetId: null,
      graphTooltip: 0,
      id: 141,
      links: [],
      panels: [],
      schemaVersion: 27,
      tags: [],
      templating: {
        list: [],
      },
      time: {
        from: 'now-6h',
        to: 'now',
      },
      timepicker: {},
      timezone: '',
      title: 'test dashboard',
      uid: '_U4zObQMz',
      version: 2,
    };

    const rhs = {
      annotations: {
        list: [
          {
            builtIn: 1,
            datasource: '-- Grafana --',
            enable: true,
            hide: true,
            iconColor: 'rgba(0, 211, 255, 1)',
            name: 'Annotations & Alerts',
            type: 'dashboard',
          },
        ],
      },
      description: 'a description',
      editable: true,
      gnetId: null,
      graphTooltip: 1,
      id: 141,
      links: [],
      panels: [
        {
          type: 'graph',
        },
      ],
      schemaVersion: 27,
      tags: ['the tag'],
      templating: {
        list: [],
      },
      time: {
        from: 'now-6h',
        to: 'now',
      },
      timepicker: {
        refresh_intervals: ['5s', '10s', '30s', '1m', '5m', '15m', '30m', '1h', '2h', '1d', '2d'],
      },
      timezone: 'utc',
      title: 'My favourite dashboard',
      uid: '_U4zObQMz',
      version: 3,
    };

    const expected = {
      description: [
        {
          endLineNumber: 14,
          op: 'add',
          originalValue: undefined,
          path: ['description'],
          startLineNumber: 14,
          value: 'a description',
        },
      ],
      graphTooltip: [
        {
          endLineNumber: 17,
          op: 'replace',
          originalValue: 0,
          path: ['graphTooltip'],
          startLineNumber: 17,
          value: 1,
        },
      ],
      panels: [
        {
          endLineNumber: 23,
          op: 'add',
          originalValue: undefined,
          path: ['panels', '0'],
          startLineNumber: 21,
          value: {
            type: 'graph',
          },
        },
      ],
      tags: [
        {
          endLineNumber: 27,
          op: 'add',
          originalValue: undefined,
          path: ['tags', '0'],
          startLineNumber: 27,
          value: 'the tag',
        },
      ],
      timepicker: [
        {
          endLineNumber: 49,
          op: 'add',
          originalValue: undefined,
          path: ['timepicker', 'refresh_intervals'],
          startLineNumber: 37,
          value: ['5s', '10s', '30s', '1m', '5m', '15m', '30m', '1h', '2h', '1d', '2d'],
        },
      ],
      timezone: [
        {
          endLineNumber: 51,
          op: 'replace',
          originalValue: '',
          path: ['timezone'],
          startLineNumber: 51,
          value: 'utc',
        },
      ],
      title: [
        {
          endLineNumber: 52,
          op: 'replace',
          originalValue: 'test dashboard',
          path: ['title'],
          startLineNumber: 52,
          value: 'My favourite dashboard',
        },
      ],
      version: [
        {
          endLineNumber: 54,
          op: 'replace',
          originalValue: 2,
          path: ['version'],
          startLineNumber: 54,
          value: 3,
        },
      ],
    };

    expect(jsonDiff(lhs as unknown as Dashboard, rhs as unknown as Dashboard)).toStrictEqual(expected);
  });
});

describe('panelDiff', () => {
  const panel = (id: number, title: string) => ({
    id,
    type: 'timeseries',
    title,
    gridPos: { h: 8, w: 12, x: 0, y: 0 },
  });

  it('marks added, removed, modified, and unchanged panels', () => {
    const lhs = {
      panels: [panel(1, 'A'), panel(2, 'B'), panel(3, 'C')],
    };
    const rhs = {
      panels: [panel(1, 'A'), { ...panel(2, 'B'), title: 'B2' }, panel(4, 'D')],
    };

    const { lhs: lhsMap, rhs: rhsMap } = panelDiff(lhs, rhs);

    expect(lhsMap.get(1)).toBe('unchanged');
    expect(rhsMap.get(1)).toBe('unchanged');

    expect(lhsMap.get(2)).toBe('modified');
    expect(rhsMap.get(2)).toBe('modified');

    expect(lhsMap.get(3)).toBe('removed');
    expect(rhsMap.get(3)).toBeUndefined();

    expect(lhsMap.get(4)).toBeUndefined();
    expect(rhsMap.get(4)).toBe('added');
  });

  it('ignores row panels', () => {
    const lhs = { panels: [{ type: 'row', title: 'Row' }, panel(1, 'A')] };
    const rhs = { panels: [{ type: 'row', title: 'Row' }, panel(1, 'A')] };
    const { lhs: lhsMap } = panelDiff(lhs, rhs);
    expect(lhsMap.get(1)).toBe('unchanged');
    expect([...lhsMap.keys()].length).toBe(1);
  });

  it('normalizes v2 specs through transformDashboardV2SpecToV1 before comparing panels', () => {
    const transformSpy = jest.spyOn(ResponseTransformers, 'transformDashboardV2SpecToV1').mockReturnValue({
      title: 'from-v2',
      panels: [panel(1, 'From v2')],
    });

    const lhs = { panels: [panel(1, 'From v1')] };
    const rhsV2 = {
      title: 'v2',
      elements: {},
      annotations: [],
      cursorSync: 'Off',
      layout: { kind: 'GridLayout', spec: { items: [] } },
      links: [],
      liveNow: false,
      tags: [],
      preload: false,
      timeSettings: {
        from: 'now-1h',
        to: 'now',
        autoRefresh: '',
        autoRefreshIntervals: [],
        timezone: '',
        hideTimepicker: false,
        fiscalYearStartMonth: 0,
      },
      variables: [],
    };

    const { lhs: lhsMap, rhs: rhsMap } = panelDiff(lhs, rhsV2);

    expect(transformSpy).toHaveBeenCalled();
    expect(lhsMap.get(1)).toBe('modified');
    expect(rhsMap.get(1)).toBe('modified');

    transformSpy.mockRestore();
  });
});
