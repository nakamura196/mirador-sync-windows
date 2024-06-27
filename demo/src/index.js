import Mirador from '@nakamura196/mirador/dist/es/src/index';
import { MiradorSyncWindowsPlugin } from '../../src';
// import { miradorRotationPlugin } from '/Users/nakamura/git/mirador/mirador-rotation-plugin/src';
// import { miradorRotationPlugin } from '../../mirador-rotation-plugin/es';
// import { miradorRotationPlugin } from "mirador-rotation"
import { miradorRotationPlugin } from "mirador-rotation"


const config = {
  id: 'demo',
  windows: [
    {
      id: "first",
      syncWindowsEnabled: true,
      rotationEnabled: true,
      rotationOpen: true,
      manifestId: "https://nakamura196.github.io/mirador2-sync-windows/data/examples/org.json" // 'https://iiif.harvardartmuseums.org/manifests/object/299843',
    },
    {
      id: "second",
      syncWindowsEnabled: true,
      rotationEnabled: true,
      rotationOpen: true,
      manifestId: 'https://nakamura196.github.io/mirador2-sync-windows/data/examples/inf.json',
    },
  ],
  theme: {
    palette: {
      primary: {
        main: '#1967d2',
      },
    },
  },
  workspace: {
    layout: {
      direction: 'row',
      first: 'first',
      second: "second",
      splitPercentage: 50,
    }
  }
};

Mirador.viewer(config, [
  ...MiradorSyncWindowsPlugin,
  miradorRotationPlugin
]);
