import { css } from '@emotion/css';

import { PageLayoutType } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Box, Text, useTheme2 } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';

type MetricCard = {
  id: string;
  label: string;
  value: string;
  change: string;
};

export function MockDashboardDemoPage() {
  const theme = useTheme2();
  const styles = getStyles(theme);
  const metricCards: MetricCard[] = [
    {
      id: 'total-requests',
      label: t('dashboard-scene.mock-dashboard-demo.metric.total-requests', 'Total requests'),
      value: '1.24M',
      change: '+4.8%',
    },
    {
      id: 'error-rate',
      label: t('dashboard-scene.mock-dashboard-demo.metric.error-rate', 'Error rate'),
      value: '0.23%',
      change: '-0.04%',
    },
    {
      id: 'p95-latency',
      label: t('dashboard-scene.mock-dashboard-demo.metric.p95-latency', 'P95 latency'),
      value: '184ms',
      change: '-12ms',
    },
    {
      id: 'active-alerts',
      label: t('dashboard-scene.mock-dashboard-demo.metric.active-alerts', 'Active alerts'),
      value: '3',
      change: '+1',
    },
  ];
  const serviceHealth = [
    {
      id: 'api-gateway',
      name: t('dashboard-scene.mock-dashboard-demo.service.api-gateway', 'API gateway'),
      status: t('dashboard-scene.mock-dashboard-demo.service-status.healthy', 'Healthy'),
      color: '#56A64B',
    },
    {
      id: 'checkout',
      name: t('dashboard-scene.mock-dashboard-demo.service.checkout', 'Checkout service'),
      status: t('dashboard-scene.mock-dashboard-demo.service-status.warning', 'Warning'),
      color: '#FF9830',
    },
    {
      id: 'notifications',
      name: t('dashboard-scene.mock-dashboard-demo.service.notifications', 'Notifications'),
      status: t('dashboard-scene.mock-dashboard-demo.service-status.healthy', 'Healthy'),
      color: '#56A64B',
    },
  ];

  return (
    <Page
      navId="dashboards/browse"
      pageNav={{
        text: t('dashboard-scene.mock-dashboard-demo.page.title', 'Mock dashboard'),
        subTitle: t(
          'dashboard-scene.mock-dashboard-demo.page.subtitle',
          'Demo view with static observability metrics'
        ),
      }}
      layout={PageLayoutType.Canvas}
    >
      <Box padding={2}>
        <div className={styles.metricGrid}>
          {metricCards.map((card) => (
            <div key={card.id} className={styles.metricCard}>
              <Text variant="bodySmall" color="secondary">
                {card.label}
              </Text>
              <Text variant="h3">{card.value}</Text>
              <Text variant="bodySmall" color="success">
                {card.change}
              </Text>
            </div>
          ))}
        </div>

        <div className={styles.panelGrid}>
          <div className={styles.panel}>
            <Text variant="h5">
              {t('dashboard-scene.mock-dashboard-demo.panel.traffic', 'Traffic trend (last 24h)')}
            </Text>
            <div className={styles.chartPlaceholder} />
          </div>

          <div className={styles.panel}>
            <Text variant="h5">
              {t('dashboard-scene.mock-dashboard-demo.panel.health', 'Service health')}
            </Text>
            <div className={styles.healthList}>
              {serviceHealth.map((service) => (
                <div key={service.id} className={styles.healthRow}>
                  <span
                    className={styles.healthDot}
                    style={{
                      backgroundColor: service.color,
                    }}
                  />
                  <Text>{service.name}</Text>
                  <Text color="secondary">{service.status}</Text>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Box>
    </Page>
  );
}

const getStyles = (theme: ReturnType<typeof useTheme2>) => {
  return {
    metricGrid: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: theme.spacing(2),
      marginBottom: theme.spacing(2),
    }),
    metricCard: css({
      background: theme.colors.background.primary,
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.radius.default,
      padding: theme.spacing(2),
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
      minHeight: 110,
    }),
    panelGrid: css({
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: theme.spacing(2),
      '@media (max-width: 960px)': {
        gridTemplateColumns: '1fr',
      },
    }),
    panel: css({
      background: theme.colors.background.primary,
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.radius.default,
      padding: theme.spacing(2),
    }),
    chartPlaceholder: css({
      marginTop: theme.spacing(2),
      height: 220,
      borderRadius: theme.shape.radius.default,
      background: `linear-gradient(180deg, ${theme.colors.primary.transparent} 0%, ${theme.colors.background.secondary} 100%)`,
      border: `1px dashed ${theme.colors.border.medium}`,
      position: 'relative',
      overflow: 'hidden',
      '&::after': {
        content: '""',
        position: 'absolute',
        left: 0,
        right: 0,
        top: '55%',
        borderTop: `2px solid ${theme.colors.primary.main}`,
        transform: 'skewY(-6deg)',
      },
    }),
    healthList: css({
      marginTop: theme.spacing(1.5),
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
    }),
    healthRow: css({
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      gap: theme.spacing(1),
      alignItems: 'center',
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      paddingBottom: theme.spacing(1),
    }),
    healthDot: css({
      width: 10,
      height: 10,
      borderRadius: theme.shape.radius.circle,
      display: 'inline-block',
    }),
  };
};

export default MockDashboardDemoPage;
