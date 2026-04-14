import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { type DecoratedRevisionModel } from 'app/features/dashboard/types/revisionModels';

import { VersionHistoryComparison } from './VersionHistoryComparison';

jest.mock('./VisualDiffView', () => ({
  VisualDiffView: function MockVisualDiffView() {
    return <div data-testid="mock-visual-diff-view" />;
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

describe('VersionHistoryComparison', () => {
  it('shows visual compare by default', () => {
    const baseInfo = revision({ version: 1 });
    const newInfo = revision({ version: 2 });
    const diffData = { lhs: { title: 'A' }, rhs: { title: 'B' } };

    render(
      <VersionHistoryComparison
        baseInfo={baseInfo}
        newInfo={newInfo}
        diffData={diffData}
        isNewLatest={false}
        onRestore={async () => true}
      />
    );

    expect(screen.getByTestId('mock-visual-diff-view')).toBeInTheDocument();
  });

  it('switches to summary tab and shows diff groups', async () => {
    const user = userEvent.setup();
    const baseInfo = revision({ version: 1 });
    const newInfo = revision({ version: 2 });
    const diffData = { lhs: { title: 'A' }, rhs: { title: 'B' } };

    render(
      <VersionHistoryComparison
        baseInfo={baseInfo}
        newInfo={newInfo}
        diffData={diffData}
        isNewLatest={false}
        onRestore={async () => true}
      />
    );

    const summaryTab = screen.getByRole('tab', { name: /summary/i });
    await user.click(summaryTab);

    expect(screen.queryByTestId('mock-visual-diff-view')).not.toBeInTheDocument();
    const groups = screen.getAllByTestId('diffGroup');
    expect(groups.length).toBeGreaterThan(0);
    expect(within(groups[0]).getByText('title')).toBeInTheDocument();
  });
});
