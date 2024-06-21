import * as actions from 'mirador/dist/es/src/state/actions';
import { getWindowConfig, getViewer, getContainerId, getConfig } from 'mirador/dist/es/src/state/selectors';
import MiradorSyncWindows from './plugins/MiradorSyncWindows';
import MiradorSyncWindowsMenuItem from './plugins/MiradorSyncWindowsMenuItem';
import MiradorSyncWindowsButton from './plugins/MiradorSyncWindowsButton';
import translations from './translations';


export const MiradorSyncWindowsPlugin = [
  {
    target: 'OpenSeadragonViewer',
    mapDispatchToProps: {
      updateConfig: actions.updateConfig,
      updateWindow: actions.updateWindow,
      updateViewport: actions.updateViewport,
    },
    mapStateToProps: (state, { windowId }) => ({
      containerId: getContainerId(state),
      enabled: getWindowConfig(state, { windowId }).syncWindowsEnabled || false,
      viewConfig: getViewer(state, { windowId }) || {},
      groups: getConfig(state).state.groups || [
        /*
        {
          name: "test",
          settings: {
            zoom: true,
            rotation: true,
            isBasicMode: false
          }
        }
          */
      ],
      groupName: getWindowConfig(state, { windowId }).groupName || "",
      zoom: getViewer(state, { windowId })?.zoom || 0,
      window: getWindowConfig(state, { windowId }),
      config: getConfig(state),
    }),
    mode: 'add',
    component: MiradorSyncWindows,
    config: {
      translations,
    },
  },
  {
    target: 'WindowTopBarPluginMenu',
    component: MiradorSyncWindowsMenuItem,
    mode: 'add',
    mapDispatchToProps: {
      updateWindow: actions.updateWindow,
    },
    mapStateToProps: (state, { windowId }) => ({
      enabled: getWindowConfig(state, { windowId }).syncWindowsEnabled || false,
    }),
  },
  {
    target: 'WorkspaceControlPanelButtons',
    component: MiradorSyncWindowsButton,
    mode: 'add',
    mapDispatchToProps: {
      updateConfig: actions.updateConfig
    },
    mapStateToProps: (state) => ({
      groups: getConfig(state).state.groups || []
    }),
  }
];
