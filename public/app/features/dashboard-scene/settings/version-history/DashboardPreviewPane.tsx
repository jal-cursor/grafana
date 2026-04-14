import { css } from '@emotion/css';
import { useEffect, useMemo, useState, type RefObject, type UIEventHandler } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Box, Stack, Text, useStyles2 } from '@grafana/ui';
import { transformDashboardV2SpecToV1 } from 'app/features/dashboard/api/ResponseTransformers';
import { isDashboardV2Spec } from 'app/features/dashboard/api/utils';
import { type DashboardDataDTO, type DashboardDTO, type DashboardMeta } from 'app/types/dashboard';

import { transformSaveModelToScene } from '../../serialization/transformSaveModelToScene';

import { PanelDiffHighlightEffect } from './PanelDiffOverlay';
import { type PanelDiffStatus } from './utils';

export type DashboardPreviewPaneProps = {
  spec: object;
  dashboardUid: string;
  version: number;
  editor: string;
  ageString: string;
  message?: string;
  highlightMap?: Map<number, PanelDiffStatus>;
  scrollRef?: RefObject<HTMLDivElement | null>;
  onScroll?: UIEventHandler<HTMLDivElement>;
};

function readOnlyMeta(uid: string): DashboardMeta {
  return {
    canStar: false,
    canShare: false,
    canDelete: false,
    canSave: false,
    canEdit: false,
    isSnapshot: true,
    isEmbedded: true,
    uid,
  };
}

function buildDashboardDto(spec: object, dashboardUid: string): DashboardDTO {
  if (isDashboardV2Spec(spec)) {
    return {
      dashboard: transformDashboardV2SpecToV1(spec, {
        name: dashboardUid,
        generation: 0,
        resourceVersion: '0',
        creationTimestamp: '',
      }),
      meta: readOnlyMeta(dashboardUid),
    };
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- v1 history payload matches DashboardDataDTO
  const v1 = spec as DashboardDataDTO;
  return {
    dashboard: { ...v1, uid: v1.uid ?? dashboardUid },
    meta: readOnlyMeta(dashboardUid),
  };
}

export function DashboardPreviewPane({
  spec,
  dashboardUid,
  version,
  editor,
  ageString,
  message,
  highlightMap,
  scrollRef,
  onScroll,
}: DashboardPreviewPaneProps) {
  const styles = useStyles2(getStyles);
  const [isActive, setIsActive] = useState(false);

  const dto = useMemo(() => buildDashboardDto(spec, dashboardUid), [spec, dashboardUid]);
  const scene = useMemo(() => transformSaveModelToScene(dto), [dto]);

  useEffect(() => {
    setIsActive(true);
    return scene.activate();
  }, [scene]);

  const { body } = scene.useState();

  return (
    <Stack direction="column" gap={1} grow={1}>
      <Box>
        <Text element="h4" variant="h5">
          <Trans
            i18nKey="dashboard-scene.version-history-comparison.preview-pane-title"
            values={{ version }}
          >
            Version {{version}} preview
          </Trans>
        </Text>
        <Text color="secondary" variant="bodySmall">
          <Trans
            i18nKey="dashboard-scene.version-history-comparison.preview-pane-meta"
            values={{ editor, timeAgo: ageString }}
          >
            Updated by {{editor}} · {{timeAgo}}
          </Trans>
          {message ? ` — ${message}` : ''}
        </Text>
        <Text color="secondary" variant="bodySmall">
          {t(
            'dashboard-scene.version-history-comparison.preview-hint',
            'Layout preview only; queries may not load in compare mode.'
          )}
        </Text>
      </Box>
      <div
        ref={scrollRef}
        className={styles.scrollRegion}
        data-testid="dashboard-version-preview-scroll"
        onScroll={onScroll}
      >
        <div className={styles.scaleWrap}>
          <div className={styles.scaledInner}>
            {isActive ? (
              <>
                <PanelDiffHighlightEffect scene={scene} statusByPanelId={highlightMap} />
                <div className={styles.bodyChrome} data-testid="dashboard-version-preview-body">
                  <body.Component model={body} />
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Stack>
  );
}

const PREVIEW_SCALE = 0.5;

const getStyles = (theme: GrafanaTheme2) => ({
  scrollRegion: css({
    label: 'version-preview-scroll',
    overflow: 'auto',
    maxHeight: '70vh',
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.canvas,
  }),
  scaleWrap: css({
    width: `${100 / PREVIEW_SCALE}%`,
    transform: `scale(${PREVIEW_SCALE})`,
    transformOrigin: 'top left',
    pointerEvents: 'none',
  }),
  scaledInner: css({
    minHeight: theme.spacing(20),
  }),
  bodyChrome: css({
    // Ensure grid layout has a defined width before scale
    width: '100%',
  }),
});
