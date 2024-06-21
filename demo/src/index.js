import Mirador from 'mirador/dist/es/src/index';
import { MiradorSyncWindowsPlugin } from '../../src';
// import { miradorImageToolsPlugin } from '../../mirador-image-tools/src';


const config = {
  id: 'demo',
  windows: [
    {
      id: "first",
      syncWindowsEnabled: true,
      imageToolsEnabled: true,
      imageToolsOpen: true,
      manifestId: "https://nakamura196.github.io/mirador2-sync-windows/data/examples/org.json" // 'https://iiif.harvardartmuseums.org/manifests/object/299843',
    },
    {
      id: "second",
      syncWindowsEnabled: true,
      imageToolsEnabled: true,
      imageToolsOpen: true,
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
  // miradorImageToolsPlugin,
]);
