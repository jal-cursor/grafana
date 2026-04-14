import { compare, type Operation } from 'fast-json-patch';
// @ts-ignore
import jsonMap from 'json-source-map';
import { flow, get, isArray, isEmpty, isEqual, last, sortBy, tail, toNumber, isNaN } from 'lodash';

import { type ObjectMeta } from 'app/features/apiserver/types';
import { transformDashboardV2SpecToV1 } from 'app/features/dashboard/api/ResponseTransformers';
import { isDashboardV2Spec } from 'app/features/dashboard/api/utils';
import { type DashboardDataDTO } from 'app/types/dashboard';

export type Diff = {
  op: 'add' | 'replace' | 'remove' | 'copy' | 'test' | '_get' | 'move';
  value: unknown;
  originalValue: unknown;
  path: string[];
  startLineNumber: number;
  endLineNumber: number;
};

export type Diffs = {
  [key: string]: Diff[];
};

type JSONValue = string | Object;

export const jsonDiff = (lhs: JSONValue, rhs: JSONValue): Diffs => {
  const diffs = compare(lhs, rhs);
  const lhsMap = jsonMap.stringify(lhs, null, 2);
  const rhsMap = jsonMap.stringify(rhs, null, 2);

  const getDiffInformation = (diffs: Operation[]): Diff[] => {
    return diffs.map((diff) => {
      let originalValue = undefined;
      let value = undefined;
      let startLineNumber = 0;
      let endLineNumber = 0;

      const path = tail(diff.path.split('/'));

      if (diff.op === 'replace' && rhsMap.pointers[diff.path]) {
        originalValue = get(lhs, path);
        value = diff.value;
        startLineNumber = rhsMap.pointers[diff.path].value.line;
        endLineNumber = rhsMap.pointers[diff.path].valueEnd.line;
      }
      if (diff.op === 'add' && rhsMap.pointers[diff.path]) {
        value = diff.value;
        startLineNumber = rhsMap.pointers[diff.path].value.line;
        endLineNumber = rhsMap.pointers[diff.path].valueEnd.line;
      }
      if (diff.op === 'remove' && lhsMap.pointers[diff.path]) {
        originalValue = get(lhs, path);
        startLineNumber = lhsMap.pointers[diff.path].value.line;
        endLineNumber = lhsMap.pointers[diff.path].valueEnd.line;
      }

      return {
        op: diff.op,
        value,
        path,
        originalValue,
        startLineNumber,
        endLineNumber,
      };
    });
  };

  const sortByLineNumber = (diffs: Diff[]) => sortBy(diffs, 'startLineNumber');
  const groupByPath = (diffs: Diff[]) =>
    diffs.reduce<Record<string, Diff[]>>((acc, value) => {
      const groupKey: string = value.path[0];
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(value);
      return acc;
    }, {});

  return flow([getDiffInformation, sortByLineNumber, groupByPath])(diffs);
};

export const getDiffText = (diff: Diff, showProp = true) => {
  const prop = last(diff.path)!;
  const propIsNumeric = isNumeric(prop);
  const val = diff.op === 'remove' ? diff.originalValue : diff.value;
  let text = getDiffOperationText(diff.op);

  if (showProp) {
    if (propIsNumeric) {
      text += ` item ${prop}`;
    } else {
      if (isArray(val) && !isEmpty(val)) {
        text += ` ${val.length} ${prop}`;
      } else {
        text += ` ${prop}`;
      }
    }
  }

  return text;
};

const isNumeric = (value: string) => !isNaN(toNumber(value));

export const getDiffOperationText = (operation: string): string => {
  if (operation === 'add') {
    return 'added';
  }
  if (operation === 'remove') {
    return 'deleted';
  }
  return 'changed';
};

/** Minimal metadata for converting a v2 dashboard spec to v1 for diff/preview. */
const EMPTY_OBJECT_META: ObjectMeta = {
  name: '',
  generation: 0,
  resourceVersion: '0',
  creationTimestamp: '',
};

export type PanelDiffStatus = 'unchanged' | 'modified' | 'added' | 'removed';

export type PanelDiffMaps = {
  /** Status for each panel id as it appears on the left (older) version */
  lhs: Map<number, PanelDiffStatus>;
  /** Status for each panel id as it appears on the right (newer) version */
  rhs: Map<number, PanelDiffStatus>;
};

type PanelLike = Record<string, unknown> & { id?: number; type?: string };

function specToDashboardData(spec: object): DashboardDataDTO {
  if (isDashboardV2Spec(spec)) {
    return transformDashboardV2SpecToV1(spec, EMPTY_OBJECT_META);
  }
  // Historical version payloads use the same shape as DashboardDataDTO.
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- narrowed after v2 guard
  return spec as DashboardDataDTO;
}

function getComparablePanels(dashboard: DashboardDataDTO): Map<number, PanelLike> {
  const panels = dashboard.panels ?? [];
  const byId = new Map<number, PanelLike>();
  for (const panel of panels) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- panel entries are untyped in save model
    const p = panel as PanelLike;
    if (p.type === 'row' || typeof p.id !== 'number') {
      continue;
    }
    byId.set(p.id, p);
  }
  return byId;
}

/**
 * Compares panel definitions between two dashboard version payloads (v1 JSON or v2 spec).
 * Panels are matched by numeric id; row panels are ignored.
 */
export function panelDiff(lhsSpec: object, rhsSpec: object): PanelDiffMaps {
  const lhsPanels = getComparablePanels(specToDashboardData(lhsSpec));
  const rhsPanels = getComparablePanels(specToDashboardData(rhsSpec));

  const lhs = new Map<number, PanelDiffStatus>();
  const rhs = new Map<number, PanelDiffStatus>();

  for (const [id, leftPanel] of lhsPanels) {
    const rightPanel = rhsPanels.get(id);
    if (!rightPanel) {
      lhs.set(id, 'removed');
    } else if (isEqual(leftPanel, rightPanel)) {
      lhs.set(id, 'unchanged');
      rhs.set(id, 'unchanged');
    } else {
      lhs.set(id, 'modified');
      rhs.set(id, 'modified');
    }
  }

  for (const [id] of rhsPanels) {
    if (!lhsPanels.has(id)) {
      rhs.set(id, 'added');
    }
  }

  return { lhs, rhs };
}
