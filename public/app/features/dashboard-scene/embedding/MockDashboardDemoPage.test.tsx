import { render, screen } from 'test/test-utils';

import { MockDashboardDemoPage } from './MockDashboardDemoPage';

describe('MockDashboardDemoPage', () => {
  it('renders metric cards and dashboard panels', async () => {
    render(<MockDashboardDemoPage />);

    expect(await screen.findByText('Total requests')).toBeInTheDocument();
    expect(screen.getByText('Error rate')).toBeInTheDocument();
    expect(screen.getByText('Traffic trend (last 24h)')).toBeInTheDocument();
    expect(screen.getByText('Service health')).toBeInTheDocument();
    expect(screen.getByText('API gateway')).toBeInTheDocument();
  });
});
