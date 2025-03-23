import Mirador from '@nakamura196/mirador/dist/es/src/index';
import { miradorRotationPlugin } from 'mirador-rotation';
import { MiradorSyncWindowsPlugin } from '../../src';
import { getJSONFromQuery, generateCustomRecursiveLayout } from '../../src/plugins/utils';

const queryConfig = getJSONFromQuery();

const defaultGroupId = 'default';

let windows = [];
let syncWindows = {};

if (!queryConfig) {
  windows = [
    {
      id: 'first',
      syncWindowsEnabled: true,
      rotationEnabled: true,
      rotationOpen: true,
      manifestId:
        'https://nakamura196.github.io/mirador2-sync-windows/data/examples/org.json',
      windowGroupId: defaultGroupId,
    },
    {
      id: 'second',
      syncWindowsEnabled: true,
      rotationEnabled: true,
      rotationOpen: true,
      manifestId:
        'https://nakamura196.github.io/mirador2-sync-windows/data/examples/inf.json',
      windowGroupId: defaultGroupId,
    },
  ];

  syncWindows = {
    groups: [
      {
        id: defaultGroupId,
        name: 'Default',
        settings: {
          zoom: true,
          rotation: true,
          isAdvanced: false,
        },
      },
    ],
  };
} else {
  windows = queryConfig.windows;
  syncWindows = queryConfig.syncWindows;
}

const layout = generateCustomRecursiveLayout(windows);

const config = {
  id: 'demo',
  windows,
  language: 'ja',
  workspace: {
    layout,
    syncWindows,
  },
};

Mirador.viewer(config, [...MiradorSyncWindowsPlugin, miradorRotationPlugin]);
