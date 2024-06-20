import Mirador from 'mirador/dist/es/src/index';
import { MiradorSyncWindowsPlugin } from '../../src';

const config = {
  id: 'demo',
  windows: [
    {
      id: "first",
      syncWindowsEnabled: true,
      manifestId: 'https://nuxt3-mirador3.vercel.app/manifest2.json',
    },
    {
      id: "second",
      syncWindowsEnabled: true,
      manifestId: 'https://nuxt3-mirador3.vercel.app/manifest.json',
    },
    {
      id: "third",
      syncWindowsEnabled: true,
      manifestId: 'https://nuxt3-mirador3.vercel.app/manifest.json',
    }
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
      second: {
        direction: 'row',
        first: 'second',
        second: 'third',
      },
      splitPercentage: 100 / 3,
    }
  }
};

Mirador.viewer(config, [
  ...MiradorSyncWindowsPlugin,
]);
