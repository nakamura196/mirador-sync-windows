import React from 'react';
import { render, screen } from './test-utils';
import { TestablesyncWindows as MiradorSyncWindows } from '../src/plugins/MiradorSyncWindows';

const mockPalette = {
  palette: {
    shades: { main: 'rgb(255, 255, 255)' },
    getContrastText: () => 'rgb(0, 0, 0)',
  },
};

function createWrapper(props) {
  return render(
    <MiradorSyncWindows
      classes={{}}
      viewer={{}}
      updateViewport={() => { }}
      updateWindow={() => { }}
      windowId="x"
      width="sm"
      theme={mockPalette}
      t={(k) => k}
      {...props}
    />,
  );
}

describe('MiradorSyncWindows', () => {
  it('renders buttons', async () => {
    createWrapper();

    expect(screen.getByRole('button', { name: 'brightness' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'contrast' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'saturation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'greyscale' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'invert' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'revert' })).toBeInTheDocument();
  });
  it('renders ImageRotation', () => {
    createWrapper();

    expect(screen.getByRole('button', { name: 'rotateLeft' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'rotateRight' })).toBeInTheDocument();
  });
  it('renders ImageFlip', () => {
    createWrapper();
    expect(screen.getByRole('button', { name: 'flip' })).toBeInTheDocument();
  });
});
