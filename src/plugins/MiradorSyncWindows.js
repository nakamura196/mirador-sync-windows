import React, { Component } from 'react';
import PropTypes from 'prop-types';
import compose from 'lodash/flowRight';
import { withSize } from 'react-sizeme';

import { styled, alpha } from '@mui/material/styles';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';

import DoDisturbIcon from '@mui/icons-material/DoDisturb';
import { createDelaunay, transformPointAndCalculateZoom } from './utils';

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

// const interval = 2000; // 200; // 0 // 20 // 200

class MiradorSyncWindows extends Component {
  static findCommonCids(windows, groupId) {
    const groupWindows = windows.filter(
      (window) => window.groupId === groupId && window.annotations3,
    );
    if (groupWindows.length === 0) return [];

    const firstWindowAnnotations = groupWindows[0].annotations3;
    return Object.keys(
      firstWindowAnnotations,
    ).filter(
      (cid) => groupWindows.every((window) => cid in window.annotations3),
    );
  }

  static processAnnotations(annotations) {
    const annotationMap = {};
    annotations.forEach((annotation) => {
      const xywh = annotation.target.split('=')[1].split(',').map(Number);
      annotationMap[annotation.cid] = [
        xywh[0] + xywh[2] / 2,
        xywh[1] + xywh[3] / 2,
      ];
    });
    return annotationMap;
  }

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

  /**
   *
   * @param {*} windows
   * @param {*} groupId
   * @returns
   * @memberof MiradorSyncWindows
   *
   *
   */
  static updateGroupWindows(windows, groupId) {
    const commonCids = MiradorSyncWindows.findCommonCids(windows, groupId);
    const updatedWindows = windows.map((originalWindow) => {
      if (originalWindow.groupId === groupId) {
        const controlPoints = commonCids.map((cid) => originalWindow.annotations3[cid]);
        const delaunay = createDelaunay(controlPoints);

        return {
          ...originalWindow,
          data: { controlPoints, delaunay },
        };
      }

      return {
        ...originalWindow,
        data: null,
      };
    });

    return updatedWindows;
  }

  componentDidUpdate(prevProps) {
    const { windowId, updateWorkspace, syncWindows } = this.props;

    if (this.shouldPerformUpdate(prevProps)) {
      const { locked } = syncWindows;

      if (locked === '') {
        updateWorkspace({
          syncWindows: {
            ...syncWindows,
            locked: windowId,
          },
        });

        this.updateViewConfig();

        return;
      }

      this.updateViewConfig();
    }
  }

  /**
 * ビューのズームレベルに基づいてウィンドウの更新を行う。
 * グループ設定に基づき、基本モードまたは変換モードでウィンドウを更新する。
 */
  handleZoomChange() {
    const {
      windowId, viewConfig, updateViewport, windowGroupId, syncWindows,
    } = this.props;

    const windows = syncWindows.windows || [];

    const groups = syncWindows.groups || [];

    const centerImage = { x: viewConfig.x, y: viewConfig.y };

    const group = groups.find((g) => g.id === windowGroupId);

    // グループ設定に従い、基本モードの使用を判断
    const isBasicMode = group ? group.settings.isBasicMode : true;
    if (isBasicMode) {
      this.updateAllWindowsBasic(viewConfig);
    } else {
      this.updateWindowsWithTransform(
        windowId,
        windows,
        windowGroupId,
        centerImage,
        updateViewport,
      );
    }
  }

  /**
 * 基本モードで全てのウィンドウを更新する。
 * すべてのウィンドウに対して同じビュー設定を適用。
 */
  updateAllWindowsBasic(viewConfig) {
    const {
      windowId, updateViewport, windowGroupId, syncWindows, /* windows, */
    } = this.props;

    const windows = syncWindows.windows || [];

    const groups = syncWindows.groups || [];

    const group = groups.find((g) => g.id === windowGroupId);

    const groupSettings = group ? group.settings : {};

    // config.
    windows.forEach((window) => {
      if (window.id !== windowId) {
        if (window.windowGroupId !== windowGroupId) return;

        const params = {};

        if (groupSettings.zoom) {
          params.x = viewConfig.x;
          params.y = viewConfig.y;
          params.zoom = viewConfig.zoom;
        }

        if (groupSettings.rotation) {
          params.rotation = viewConfig.rotation;
        }

        params.immediately = true;

        updateViewport(window.id, params);
      }
    });
  }

  /**
 * 変換モードでウィンドウを更新する。
 * ソースウィンドウのビュー設定に基づいて、他のウィンドウのビューを調整。
 */
  updateWindowsWithTransform(
    windowId,
    windows,
    windowGroupId,
    centerImage,
    updateViewport,
    syncWindows,
  ) {
    const groups = syncWindows.groups || [];

    const group = groups.find((g) => g.id === windowGroupId);

    const groupSettings = group ? group.settings : {};

    const { viewConfig } = this.props;
    const sourceWindow = windows.find((window) => window.id === windowId);
    if (!sourceWindow || !sourceWindow.data) return;

    const { delaunay, controlPoints: controlPointsImage1 } = sourceWindow.data;

    windows.forEach((targetWindow) => {
      if (targetWindow.id !== windowId && targetWindow.groupId === windowGroupId) {
        if (!targetWindow.data) return;

        const controlPointsImage2 = targetWindow.data.controlPoints;
        const transformResult = transformPointAndCalculateZoom(
          [centerImage.x, centerImage.y],
          delaunay,
          controlPointsImage1,
          controlPointsImage2,
        );

        if (transformResult) {
          const { transformedPoint, zoomRatio } = transformResult;

          const params = {};

          if (groupSettings.zoom) {
            [params.x, params.y] = transformedPoint;
            params.zoom = zoomRatio * viewConfig.zoom;
          }

          /*
          if (groupSettings.rotation) {
            // 要調整
            // params.rotation = viewConfig.rotation;
          }
          */

          params.immediately = true;

          updateViewport(targetWindow.id, params);
        }
      }
    });
  }

  /**
   * ビュー設定に基づいてコンポーネントの状態を更新する。
   * 具体的な更新ロジックはこのメソッド内に実装される。
   */
  updateViewConfig() {
    this.handleZoomChange();
    this.release();
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
      updateWindow, windowId, windowGroupId, updateWorkspace, syncWindows, windows,
    } = this.props;

    if (windowGroupId === selectedGroupId) {
      return;
    }

    updateWindow(windowId, { windowGroupId: selectedGroupId });

    const copiedWindows = syncWindows.windows || [...windows];

    copiedWindows.forEach((window) => {
      if (window.id === windowId) {
        // Creating a new object and copying properties from the original window object
        const updatedWindow = { ...window, windowGroupId: selectedGroupId };
        // Find the index of the current window in the array
        const index = copiedWindows.indexOf(window);
        // Replace the old window object with the updated one
        copiedWindows[index] = updatedWindow;
      }
    });

    await this.fetchAndStoreAnnotations(copiedWindows, windowId);

    const updatedWindows = MiradorSyncWindows.updateGroupWindows(copiedWindows, selectedGroupId);

    updateWorkspace({
      syncWindows: {
        ...syncWindows,
        locked: '',
        windows: updatedWindows,
      },
    });
  }

  /**
   * ウィンドウのアノテーションを取得し、保存する。
   * ウィンドウのアノテーションが存在しない場合のみ取得する。
   * アノテーションは、ウィンドウの annotations2 プロパティに保存される。
   * @param {Object} config - Mirador の設定オブジェクト
   * @param {Array} windows - ウィンドウの配列
   * @param {String} windowId - ウィンドウの ID
   * @returns {Promise<void>}
   * @memberof MiradorSyncWindows
   * @private
   * @async
   * @method
   * @instance
   * @memberof MiradorSyncWindows
   * @private
   * @async
   * */

  async fetchAndStoreAnnotations(windows, windowId) {
    // Collect all promises
    const fetchPromises = windows.map((window) => {
      if (window.id === windowId && !window.annotations2) {
        return this.fetchAnnotationsForWindow(window);
      }
      return Promise.resolve();
    });

    // Await all promises simultaneously
    await Promise.all(fetchPromises);
  }

  async fetchAnnotationsForWindow(/* window */ originalWindow) {
    try {
      const response = await fetch(originalWindow.manifestId);
      const manifest = await response.json();
      if (manifest && manifest.items) {
        const annotations2 = {};
        const annotations3 = {};

        manifest.items.forEach((canvas) => {
          if (canvas.annotations) {
            const annotationMap = this.processAnnotations(canvas.annotations[0].items);
            annotations2[canvas.id] = annotationMap;

            // Object.entries() を使用して、annotationMap を反復処理します
            Object.entries(annotationMap).forEach(([cid, xy]) => {
              annotations3[cid] = xy;
            });
          }
        });

        const newWindow = {
          ...originalWindow,
          annotations2,
          annotations3,
        };

        return newWindow;
      }

      return originalWindow;
    } catch (error) {
      return originalWindow;
    }
  }

  release() {
    const { updateWorkspace, syncWindows } = this.props;

    updateWorkspace({
      syncWindows: {
        ...syncWindows,
        locked: '',
      },
    });
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
  viewer: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  viewConfig: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  windowId: PropTypes.string.isRequired,
  windowGroupId: PropTypes.string,
  windows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      windowGroupId: PropTypes.string,
      manifestId: PropTypes.string.isRequired,
      annotations2: PropTypes.object, // eslint-disable-line react/forbid-prop-types
      annotations3: PropTypes.object, // eslint-disable-line react/forbid-prop-types
      data: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    }),
  ),

  updateWorkspace: PropTypes.func.isRequired,

  syncWindows: PropTypes.shape({
    groups: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        settings: PropTypes.shape({
          zoom: PropTypes.bool.isRequired,
          rotation: PropTypes.bool.isRequired,
          isBasicMode: PropTypes.bool.isRequired,
        }).isRequired,
      }),
    ),
    windows: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        windowGroupId: PropTypes.string,
        manifestId: PropTypes.string.isRequired,
        annotations2: PropTypes.object, // eslint-disable-line react/forbid-prop-types
        annotations3: PropTypes.object, // eslint-disable-line react/forbid-prop-types
        data: PropTypes.object, // eslint-disable-line react/forbid-prop-types
      }),
    ),
    locked: PropTypes.string,
  }).isRequired,

};

MiradorSyncWindows.defaultProps = {
  enabled: true,
  viewer: undefined,
  viewConfig: {},
  windows: [],
  windowGroupId: '',
};

// Export without wrapping HOC for testing.
export const TestablesyncWindows = MiradorSyncWindows;

export default compose(withSize())(MiradorSyncWindows);
