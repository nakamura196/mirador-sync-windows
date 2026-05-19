import React, { Component } from 'react';
import PropTypes from 'prop-types';
import compose from 'lodash/flowRight';
import { withSize } from 'react-sizeme';

import { styled, alpha } from '@mui/material/styles';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';

import DoDisturbIcon from '@mui/icons-material/DoDisturb';

import { updateWindowsWithTransform } from './advanced';

import { updateAllWindowsBasic } from './basic';

const SizeContainer = styled('div')(() => ({
  position: 'static !important',
}));

const ToggleContainer = styled('div')(() => ({
  border: 0,
  borderImageSlice: 1,
}));

const ToolContainer = styled('div')(() => ({
  display: 'flex',
  border: 0,
  borderImageSlice: 1,
}));

/** Styles for withStyles HOC */
const Root = styled('div')(({ small, theme: { palette } }) => {
  const backgroundColor = palette.shades.main;
  const foregroundColor = palette.getContrastText(backgroundColor);
  const border = `1px solid ${alpha(foregroundColor, 0.2)}`;
  const borderImageRight = 'linear-gradient('
    + 'to bottom, '
    + `${alpha(foregroundColor, 0)} 20%, `
    + `${alpha(foregroundColor, 0.2)} 20% 80%, `
    + `${alpha(foregroundColor, 0)} 80% )`;
  const borderImageBottom = borderImageRight.replace('to bottom', 'to right');
  return {
    backgroundColor: alpha(backgroundColor, 0.8),
    /* borderRadius: 25, */
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 999,
    display: 'flex',
    flexDirection: 'row',
    ...(small && { flexDirection: 'column' }),
    [ToggleContainer]: {
      ...(small && {
        borderBottom: border,
        borderImageSource: borderImageBottom,
        display: 'flex',
      }),
    },
    [ToolContainer]: {
      ...(!small && {
        borderRight: border,
        borderImageSource: borderImageRight,
        flexDirection: 'row',
      }),
      ...(small && {
        flexDirection: 'column',
        borderBottom: border,
        borderImageSource: borderImageBottom,
      }),
    },
  };
});

class MiradorSyncWindows extends Component {
  /**
   * ビュー設定が前回と異なるかどうかを比較する。
   * x, y, または zoom レベルのどれか一つでも変わっていれば true を返す。
   */

  static hasViewConfigChanged(prevConfig, currentConfig) {
    return prevConfig.x !== currentConfig.x
      || prevConfig.y !== currentConfig.y
      || prevConfig.zoom !== currentConfig.zoom;
    // || prevConfig.rotation !== currentConfig.rotation;
  }

  constructor(props) {
    super(props);
    this.handleViewerAnimation = this.handleViewerAnimation.bind(this);
    // 現在 'animation' ハンドラを取り付けている OpenSeadragon viewer インスタンス。
    this.viewerWithHandler = null;
    // 1 フレームにつき 1 回だけ同期するためのガード。
    this.animationFramePending = false;
  }

  componentDidMount() {
    this.attachViewerHandler();
  }

  componentDidUpdate(prevProps) {
    const { windowId, focusedWindowId, viewConfig } = this.props;

    // viewer インスタンスは差し替わることがある（ウィンドウ再生成時など）。
    this.attachViewerHandler();

    const isShouldPerformUpdate = this.shouldPerformUpdate(prevProps);

    if (isShouldPerformUpdate) {
      if (focusedWindowId === windowId) {
        this.syncFromViewConfig(viewConfig);
      }
    }
  }

  componentWillUnmount() {
    this.detachViewerHandler();
  }

  /**
   * OSD の 'animation' イベントに応じて、操作中ウィンドウの現在のビューポートを
   * 読み取り追従ウィンドウへ同期する。複数イベントは 1 フレーム 1 回に集約する。
   */
  handleViewerAnimation() {
    const {
      viewer, windowId, focusedWindowId, windowGroupId,
    } = this.props;

    // 同期を配信するのは「ユーザーが今まさに操作しているウィンドウ」のみ。
    if (!windowGroupId || focusedWindowId !== windowId) return;
    if (!viewer || !viewer.viewport) return;
    if (this.animationFramePending) return;

    this.animationFramePending = true;
    // eslint-disable-next-line no-undef
    window.requestAnimationFrame(() => {
      this.animationFramePending = false;
      const { viewport } = viewer;
      if (!viewport) return;
      const center = viewport.getCenter(true);
      this.syncFromViewConfig({
        x: center.x,
        y: center.y,
        zoom: viewport.getZoom(true),
        rotation: typeof viewport.getRotation === 'function' ? viewport.getRotation() : 0,
      });
    });
  }

  /**
   * 操作中ウィンドウの OpenSeadragon viewer に 'animation' ハンドラを取り付ける。
   * Redux の viewConfig は OSD の animation-finish 時にしか更新されないため、
   * それだけに頼ると追従ウィンドウは「操作を止めるまで動かない」。'animation'
   * イベント（ドラッグ/ズームの各フレームで発火）を直接拾うことで遅延をなくす。
   */
  attachViewerHandler() {
    const { viewer } = this.props;
    if (viewer === this.viewerWithHandler) return;
    this.detachViewerHandler();
    if (viewer && typeof viewer.addHandler === 'function') {
      viewer.addHandler('animation', this.handleViewerAnimation);
      this.viewerWithHandler = viewer;
    }
  }

  /** 取り付けた 'animation' ハンドラを解除する。 */
  detachViewerHandler() {
    const viewer = this.viewerWithHandler;
    if (viewer && typeof viewer.removeHandler === 'function') {
      viewer.removeHandler('animation', this.handleViewerAnimation);
    }
    this.viewerWithHandler = null;
  }

  /**
 * 指定された viewConfig（x, y, zoom, rotation）に基づき、同一グループの
 * 他ウィンドウを同期する。グループ設定に従い基本モード／変換モードを切り替える。
 */
  async syncFromViewConfig(viewConfig) {
    const {
      windowId, updateViewport, windowGroupId, syncWindows,
      updateWorkspace, windowsAll,
    } = this.props;

    if (!windowGroupId || !viewConfig) return;

    const windowsMap = windowsAll;

    // もし計算済みのデータがあれば、それを使う

    if (syncWindows.windows) {
      Object.values(syncWindows.windows).forEach((window) => {
        if (windowsMap[window.id]) {
          windowsMap[window.id].data = window.data;
        }
      });
    }

    const windows = [];

    Object.values(windowsMap).forEach((window) => {
      windows.push(window);
    });

    const groups = syncWindows.groups || [];

    const centerImage = { x: viewConfig.x, y: viewConfig.y };

    const group = groups.find((g) => g.id === windowGroupId);

    // グループ設定に従い、基本モードの使用を判断
    const isAdvanced = group ? group.settings.isAdvanced : false;

    if (!isAdvanced) {
      updateAllWindowsBasic(windowId, windowGroupId, groups, windows, updateViewport, viewConfig);
    } else {
      updateWindowsWithTransform(
        windowId,
        windowGroupId,
        centerImage,
        updateViewport,
        groups,
        windows,
        updateWorkspace,
        viewConfig,
      );
    }
  }

  /**
 * ビュー更新前に実行すべきかどうかを判断する。
 * groupIdが存在し、ビューの設定（x, y, zoom）に変更がある場合にtrueを返す。
 */
  shouldPerformUpdate(prevProps) {
    const { viewConfig, windowGroupId } = this.props;
    return windowGroupId
      && MiradorSyncWindows.hasViewConfigChanged(prevProps.viewConfig, viewConfig);
  }

  async selectGroup(selectedGroupId) {
    const {
      updateWindow, windowId, windowGroupId,
    } = this.props;

    if (windowGroupId === selectedGroupId) {
      return;
    }

    updateWindow(windowId, { windowGroupId: selectedGroupId });
  }

  render() {
    const {
      enabled,
      viewer,
      syncWindows,
      windowGroupId,
      t,
    } = this.props;

    if (!viewer || !enabled) return null;

    const groups = syncWindows.groups || [];

    return (
      <SizeContainer>
        <Root className="MuiPaper-elevation4">

          <List>

            <ListItem
              disablePadding
              onClick={
                () => this.selectGroup('')
              }
            >
              <ListItemButton selected={
                !windowGroupId
              }
              >
                <DoDisturbIcon style={{ marginRight: 8 }} />
                {' '}
                {t('no_group')}
              </ListItemButton>
            </ListItem>

            {groups.map((group) => {
              const isSelected = group.id === windowGroupId;
              return (
                <ListItem disablePadding key={group.id}>
                  <ListItemButton
                    onClick={
                      () => this.selectGroup(group.id)
                    }
                    selected={
                      isSelected
                    }
                  >
                    {group.name}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Root>
      </SizeContainer>
    );
  }
}

MiradorSyncWindows.propTypes = {
  enabled: PropTypes.bool,
  t: PropTypes.func.isRequired,
  updateViewport: PropTypes.func.isRequired,
  updateWindow: PropTypes.func.isRequired,
  updateWorkspace: PropTypes.func.isRequired,
  viewer: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  viewConfig: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  windowId: PropTypes.string.isRequired,
  windowGroupId: PropTypes.string,
  windowsAll: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  focusedWindowId: PropTypes.string.isRequired,
  syncWindows: PropTypes.shape({
    groups: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        settings: PropTypes.shape({
          zoom: PropTypes.bool.isRequired,
          rotation: PropTypes.bool.isRequired,
          isAdvanced: PropTypes.bool.isRequired,
        }).isRequired,
      }),
    ),
    windows: PropTypes.arrayOf( // eslint-disable-line react/forbid-prop-types
      PropTypes.object, // eslint-disable-line react/forbid-prop-types
    ),
  }).isRequired,

};

MiradorSyncWindows.defaultProps = {
  enabled: true,
  viewer: undefined,
  viewConfig: {},
  windowsAll: {},
  windowGroupId: '',
};

// Export without wrapping HOC for testing.
export const TestablesyncWindows = MiradorSyncWindows;

export default compose(withSize())(MiradorSyncWindows);
