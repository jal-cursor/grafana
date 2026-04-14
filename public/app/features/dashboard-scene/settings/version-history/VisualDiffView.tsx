import { css } from '@emotion/css';
import { useCallback, useMemo, useRef } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Stack, Text, useStyles2, useTheme2 } from '@grafana/ui';
import { type DecoratedRevisionModel } from 'app/features/dashboard/types/revisionModels';

import { DashboardPreviewPane } from './DashboardPreviewPane';
import { panelDiff } from './utils';

type VisualDiffViewProps = {
  baseInfo: DecoratedRevisionModel;
  newInfo: DecoratedRevisionModel;
  diffData: { lhs: object; rhs: object };
};

export function VisualDiffView({ baseInfo, newInfo, diffData }: VisualDiffViewProps) {
  const styles = useStyles2(getStyles);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const syncingScroll = useRef(false);

  const { lhs: lhsMap, rhs: rhsMap } = useMemo(
    () => panelDiff(diffData.lhs, diffData.rhs),
    [diffData.lhs, diffData.rhs]
  );

  const dashboardUid = baseInfo.uid || newInfo.uid;

  const mirrorScroll = useCallback((source: HTMLDivElement, target: HTMLDivElement | null) => {
    if (!target || syncingScroll.current) {
      return;
    }
    syncingScroll.current = true;
    target.scrollTop = source.scrollTop;
    target.scrollLeft = source.scrollLeft;
    window.requestAnimationFrame(() => {
      syncingScroll.current = false;
    });
  }, []);

  const onLeftScroll = useCallback(() => {
    const left = leftScrollRef.current;
    const right = rightScrollRef.current;
    if (left && right) {
      mirrorScroll(left, right);
    }
  }, [mirrorScroll]);

  const onRightScroll = useCallback(() => {
    const left = leftScrollRef.current;
    const right = rightScrollRef.current;
    if (left && right) {
      mirrorScroll(right, left);
    }
  }, [mirrorScroll]);

  return (
    <Stack direction="column" gap={2}>
      <div className={styles.legend} data-testid="dashboard-version-visual-legend">
        <Text variant="bodySmall" color="secondary">
          {t('dashboard-scene.version-history-comparison.legend-title', 'Panel changes')}
        </Text>
        <Stack direction="row" gap={3} wrap="wrap">
          <LegendSwatch
            colorVar="warning"
            label={t('dashboard-scene.version-history-comparison.legend-modified', 'Modified')}
          />
          <LegendSwatch
            colorVar="success"
            label={t('dashboard-scene.version-history-comparison.legend-added', 'Added')}
          />
          <LegendSwatch
            colorVar="error"
            label={t('dashboard-scene.version-history-comparison.legend-removed', 'Removed')}
          />
        </Stack>
      </div>
      <div className={styles.paneGrid} data-testid="dashboard-version-visual-panes">
        <div className={styles.pane}>
          <DashboardPreviewPane
            spec={diffData.lhs}
            dashboardUid={dashboardUid}
            version={baseInfo.version}
            editor={baseInfo.createdBy}
            ageString={baseInfo.ageString}
            message={baseInfo.message}
            highlightMap={lhsMap}
            scrollRef={leftScrollRef}
            onScroll={onLeftScroll}
          />
        </div>
        <div className={styles.paneDivider} aria-hidden />
        <div className={styles.pane}>
          <DashboardPreviewPane
            spec={diffData.rhs}
            dashboardUid={dashboardUid}
            version={newInfo.version}
            editor={newInfo.createdBy}
            ageString={newInfo.ageString}
            message={newInfo.message}
            highlightMap={rhsMap}
            scrollRef={rightScrollRef}
            onScroll={onRightScroll}
          />
        </div>
      </div>
    </Stack>
  );
}

function LegendSwatch({ label, colorVar }: { label: string; colorVar: 'warning' | 'success' | 'error' }) {
  const theme = useTheme2();
  const bg = theme.colors[colorVar].main;
  return (
    <Stack direction="row" gap={1} alignItems="center">
      <span
        className={css({
          width: theme.spacing(2),
          height: theme.spacing(2),
          borderRadius: theme.shape.radius.default,
          background: bg,
          flexShrink: 0,
        })}
      />
      <Text variant="bodySmall">{label}</Text>
    </Stack>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  legend: css({
    padding: theme.spacing(1, 2),
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
  }),
  paneGrid: css({
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: theme.spacing(2),
    alignItems: 'stretch',
    minWidth: 0,
  }),
  pane: css({
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  }),
  paneDivider: css({
    width: 1,
    background: theme.colors.border.medium,
    alignSelf: 'stretch',
  }),
});
