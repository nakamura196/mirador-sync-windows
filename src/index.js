import * as actions from '@nakamura196/mirador/dist/es/src/state/actions';
import {
  getWindowConfig, getViewer, getContainerId,
  getWorkspace,
} from '@nakamura196/mirador/dist/es/src/state/selectors';
import MiradorSyncWindows from './plugins/MiradorSyncWindows';
import MiradorSyncWindowsMenuItem from './plugins/MiradorSyncWindowsMenuItem';
import MiradorSyncWindowsButton from './plugins/MiradorSyncWindowsButton';
import translations from './translations';

export const MiradorSyncWindowsPlugin = [
  {
    target: 'OpenSeadragonViewer',
    mapDispatchToProps: {
      updateWindow: actions.updateWindow,
      updateViewport: actions.updateViewport,
      updateWorkspace: actions.updateWorkspace,
    },
    mapStateToProps: (state, { windowId }) => ({
      containerId: getContainerId(state),
      enabled: getWindowConfig(state, { windowId }).syncWindowsEnabled || false,
      viewConfig: getViewer(state, { windowId }) || {},
      windowGroupId: getWindowConfig(state, { windowId }).windowGroupId || '',
      zoom: getViewer(state, { windowId })?.zoom || 0,
      syncWindows: getWorkspace(state).syncWindows || {},
      focusedWindowId: getWorkspace(state).focusedWindowId || {},
      workspace: getWorkspace(state) || {},
      windowsAll: state.windows,
    }),
    mode: 'add',
    component: MiradorSyncWindows,
    config: {
      translations,
    },
  },
  {
    target: 'WindowTopBarPluginMenu',

    mode: 'add',
    mapDispatchToProps: {
      updateWindow: actions.updateWindow,
    },
    mapStateToProps: (state, { windowId }) => ({
      enabled: getWindowConfig(state, { windowId }).syncWindowsEnabled || false,
    }),
    component: MiradorSyncWindowsMenuItem,
    config: {
      translations,
    },
  },
  {
    target: 'WorkspaceControlPanelButtons',

    mode: 'add',
    mapDispatchToProps: {
      updateWorkspace: actions.updateWorkspace,
    },
    mapStateToProps: (state) => ({
      syncWindows: getWorkspace(state).syncWindows || {},
    }),
    component: MiradorSyncWindowsButton,
    config: {
      translations,
    },
  },
];
