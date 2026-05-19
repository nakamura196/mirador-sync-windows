import React from 'react';
import { render, screen } from './test-utils';
import { TestablesyncWindows as MiradorSyncWindows } from '../src/plugins/MiradorSyncWindows';

/** Render the sync-windows panel with sensible defaults, overridable per test. */
function createWrapper(props) {
  return render(
    <MiradorSyncWindows
      enabled
      viewer={{}}
      viewConfig={{}}
      windowId="window-1"
      focusedWindowId="window-1"
      windowGroupId=""
      windowsAll={{}}
      syncWindows={{ groups: [] }}
      updateViewport={() => {}}
      updateWindow={() => {}}
      updateWorkspace={() => {}}
      t={(key) => key}
      {...props}
    />,
  );
}

const group = (id, name) => ({
  id,
  name,
  settings: { zoom: true, rotation: false, isAdvanced: false },
});

describe('MiradorSyncWindows', () => {
  it('renders the "no group" option', () => {
    createWrapper();
    expect(screen.getByRole('button', { name: /no_group/ })).toBeInTheDocument();
  });

  it('renders a button for each sync group', () => {
    createWrapper({
      syncWindows: { groups: [group('g1', 'Group One'), group('g2', 'Group Two')] },
    });
    expect(screen.getByRole('button', { name: 'Group One' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Group Two' })).toBeInTheDocument();
  });

  it('renders nothing when disabled', () => {
    const { container } = createWrapper({ enabled: false });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing without a viewer', () => {
    const { container } = createWrapper({ viewer: undefined });
    expect(container).toBeEmptyDOMElement();
  });
});
