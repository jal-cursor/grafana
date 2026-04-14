import { useLayoutEffect } from 'react';

import { sceneGraph } from '@grafana/scenes';
import { useTheme2 } from '@grafana/ui';

import { type DashboardScene } from '../../scene/DashboardScene';
import { DashboardGridItem } from '../../scene/layout-default/DashboardGridItem';
import { getPanelIdForVizPanel } from '../../utils/utils';

import { type PanelDiffStatus } from './utils';

function applyHighlight(
  el: HTMLElement,
  status: PanelDiffStatus,
  colors: { modified: string; added: string; removed: string }
) {
  const width = '3px';
  switch (status) {
    case 'modified':
      el.style.outline = `${width} solid ${colors.modified}`;
      break;
    case 'added':
      el.style.outline = `${width} solid ${colors.added}`;
      break;
    case 'removed':
      el.style.outline = `${width} solid ${colors.removed}`;
      break;
    default:
      break;
  }
  el.style.outlineOffset = '-1px';
}

/**
 * Walks the preview {@link DashboardScene} and outlines grid items whose panel id
 * has a non-unchanged status in the compare maps.
 */
export function PanelDiffHighlightEffect({
  scene,
  statusByPanelId,
}: {
  scene: DashboardScene | null;
  statusByPanelId?: Map<number, PanelDiffStatus>;
}) {
  const theme = useTheme2();

  useLayoutEffect(() => {
    if (!scene || !statusByPanelId?.size) {
      return undefined;
    }

    const colors = {
      modified: theme.colors.warning.main,
      added: theme.colors.success.main,
      removed: theme.colors.error.main,
    };

    const run = (): Array<() => void> => {
      const items = sceneGraph.findAllObjects(
        scene,
        (o): o is DashboardGridItem => o instanceof DashboardGridItem
      );
      const cleanups: Array<() => void> = [];

      for (const gridItem of items) {
        const key = gridItem.state.body?.state?.key;
        if (!key?.startsWith('panel-')) {
          continue;
        }

        let panelId: number;
        try {
          panelId = getPanelIdForVizPanel(gridItem.state.body);
        } catch {
          continue;
        }

        const status = statusByPanelId.get(panelId);
        if (!status || status === 'unchanged') {
          continue;
        }

        const el = gridItem.containerRef.current;
        if (!el) {
          continue;
        }

        const prevOutline = el.style.outline;
        const prevOutlineOffset = el.style.outlineOffset;
        applyHighlight(el, status, colors);
        cleanups.push(() => {
          el.style.outline = prevOutline;
          el.style.outlineOffset = prevOutlineOffset;
        });
      }

      return cleanups;
    };

    let cleanups = run();
    const retryTimers: number[] = [250, 750, 1500].map((delay) =>
      window.setTimeout(() => {
        cleanups.forEach((c) => c());
        cleanups = run();
      }, delay)
    );

    return () => {
      retryTimers.forEach((id) => window.clearTimeout(id));
      cleanups.forEach((c) => c());
    };
  }, [scene, statusByPanelId, theme]);

  return null;
}
