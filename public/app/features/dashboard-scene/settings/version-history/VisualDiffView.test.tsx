import { render, screen } from '@testing-library/react';

import { type DecoratedRevisionModel } from 'app/features/dashboard/types/revisionModels';

import { VisualDiffView } from './VisualDiffView';

jest.mock('./DashboardPreviewPane', () => ({
  DashboardPreviewPane: function MockDashboardPreviewPane() {
    return <div data-testid="mock-dashboard-preview-pane" />;
  },
}));

function revision(partial: Partial<DecoratedRevisionModel>): DecoratedRevisionModel {
  return {
    id: 1,
    checked: false,
    uid: 'uid-1',
    version: 1,
    created: '2020-01-01T00:00:00Z',
    createdBy: 'admin',
    message: '',
    data: {},
    createdDateString: '2020-01-01',
    ageString: 'some time ago',
    ...partial,
  };
}

describe('VisualDiffView', () => {
  it('renders legend and two preview panes', () => {
    const baseInfo = revision({ version: 1, uid: 'd-1' });
    const newInfo = revision({ version: 2, uid: 'd-1' });
    const diffData = {
      lhs: { panels: [] },
      rhs: { panels: [] },
    };

    render(<VisualDiffView baseInfo={baseInfo} newInfo={newInfo} diffData={diffData} />);

    expect(screen.getByTestId('dashboard-version-visual-legend')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-version-visual-panes')).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-dashboard-preview-pane')).toHaveLength(2);
  });
});
