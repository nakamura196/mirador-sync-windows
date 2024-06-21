import React, { Component } from 'react';
import PropTypes from 'prop-types';
import compose from 'lodash/flowRight';
import { withSize } from 'react-sizeme';

import { createDelaunay, transformPointAndCalculateZoom } from './utils';

import { styled, alpha } from '@mui/material/styles';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import DoDisturbIcon from '@mui/icons-material/DoDisturb';


// import { updateViewport } from 'mirador/dist/es/src/state/actions/viewport';

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



const interval = 200 // 0 // 20 // 200

class MiradorSyncWindows extends Component {
  constructor(props) {
    super(props);
    this.lastUpdateTime = 0;
    this.updateConfigState = this.updateConfigState.bind(this);
  }

  componentDidUpdate(prevProps) {
    const now = Date.now();
    if (now - this.lastUpdateTime > interval) {
      this.lastUpdateTime = now;

      if (this.shouldPerformUpdate(prevProps)) {
        {
          this.updateViewConfig();
        }
      }
    }
  }

  /**
 * ビュー更新前に実行すべきかどうかを判断する。
 * groupNameが存在し、ビューの設定（x, y, zoom）に変更がある場合にtrueを返す。
 */
  shouldPerformUpdate(prevProps) {
    const { viewConfig, groupName } = this.props;
    return groupName && this.hasViewConfigChanged(prevProps.viewConfig, viewConfig);
  }

  /**
   * ビュー設定が前回と異なるかどうかを比較する。
   * x, y, または zoom レベルのどれか一つでも変わっていれば true を返す。
   */

  hasViewConfigChanged(prevConfig, currentConfig) {
    return prevConfig.x !== currentConfig.x || prevConfig.y !== currentConfig.y || prevConfig.zoom !== currentConfig.zoom || prevConfig.rotation !== currentConfig.rotation;
  }

  /**
 * ビューの設定が変更されたかどうかを確認する。
 * グループ設定がズームを考慮する場合のみ、位置やズームレベルの変更をチェックする。
 */
  shouldUpdateViewConfig(prevConfig) {

    const { viewConfig, groups, groupName } = this.props;
    const group = groups.find(g => g.name === groupName);
    if (!group) return false;

    return this.hasViewConfigChanged(prevConfig, viewConfig);
  }

  /**
   * ビュー設定に基づいてコンポーネントの状態を更新する。
   * 具体的な更新ロジックはこのメソッド内に実装される。
   */
  updateViewConfig() {
    const { config } = this.props;

    if (config.state.isSyncOk === undefined) {
      this.updateConfigState(true);
    }

    if (!config.state.isSyncOk) return;

    this.updateConfigState(false);
    this.handleZoomChange();
    setTimeout(() => this.updateConfigState(true), interval);
  }

  updateConfigState(isSyncOk) {
    const { updateConfig } = this.props;
    updateConfig({
      state: {
        isSyncOk
      }
    });
  }

  /**
 * ビューのズームレベルに基づいてウィンドウの更新を行う。
 * グループ設定に基づき、基本モードまたは変換モードでウィンドウを更新する。
 */
  handleZoomChange() {
    const { windowId, viewConfig, updateViewport, config, groupName, groups } = this.props;
    const centerImage = { x: viewConfig.x, y: viewConfig.y };

    const group = groups.find(g => g.name === groupName);

    // グループ設定に従い、基本モードの使用を判断
    const isBasicMode = group ? group.settings.isBasicMode : true;
    if (isBasicMode) {
      this.updateAllWindowsBasic(viewConfig);
    } else {
      this.updateWindowsWithTransform(windowId, config, groupName, centerImage, updateViewport);
    }
  }

  /**
 * 基本モードで全てのウィンドウを更新する。
 * すべてのウィンドウに対して同じビュー設定を適用。
 */
  updateAllWindowsBasic(viewConfig) {
    const { windowId, updateViewport, groups, groupName, config } = this.props;

    const group = groups.find(g => g.name === groupName);

    const groupSettings = group ? group.settings : {};

    config.windows.forEach(window => {
      if (window.id !== windowId) {

        if (window.groupName !== groupName) return;

        const params = {}

        if (groupSettings.zoom) {
          params.x = viewConfig.x;
          params.y = viewConfig.y;
          params.zoom = viewConfig.zoom;
        }

        if (groupSettings.rotation) {
          params.rotation = viewConfig.rotation;
        }

        updateViewport(window.id, params);
      }
    });
  }

  /**
 * 変換モードでウィンドウを更新する。
 * ソースウィンドウのビュー設定に基づいて、他のウィンドウのビューを調整。
 */
  updateWindowsWithTransform(windowId, config, groupName, centerImage, updateViewport) {
    const { viewConfig } = this.props;
    const sourceWindow = config.windows.find(window => window.id === windowId);
    if (!sourceWindow || !sourceWindow.data) return;

    const { delaunay, controlPoints: controlPointsImage1 } = sourceWindow.data;

    config.windows.forEach(targetWindow => {
      if (targetWindow.id !== windowId && targetWindow.groupName === groupName) {
        if (!targetWindow.data) return;

        const controlPointsImage2 = targetWindow.data.controlPoints;
        const transformResult = transformPointAndCalculateZoom(
          [centerImage.x, centerImage.y],
          delaunay,
          controlPointsImage1,
          controlPointsImage2
        );

        if (transformResult) {
          const { transformedPoint, zoomRatio } = transformResult;

          const params = {}

          if (groupSettings.zoom) {
            params.x = transformedPoint[0]
            params.y = transformedPoint[1]
            params.zoom = zoomRatio * viewConfig.zoom
          }

          if (groupSettings.rotation) {
            // 要調整
            // params.rotation = viewConfig.rotation;
          }

          updateViewport(window.id, params);
        }
      }
    });
  }

  handleChange(param) {
    const { updateViewport, windowId } = this.props;
    return (value) => updateViewport(windowId, { [param]: value });
  }

  async selectGroup(name) {
    const { updateWindow, windowId, window, config /*, updateConfig */ } = this.props;

    if (window.groupName === name) {
      return;
    }

    updateWindow(windowId, { groupName: name });

    for (const window of config.windows) {

      if (window.id === windowId) {
        window.groupName = name
      }
    }

    await this.fetchAndStoreAnnotations(config, windowId);

    if (name) {
      this.updateGroupWindows(config, name);
    }

    /*
    updateConfig({
      state: {
        windows: config.windows
      }
    })
    */
  }

  async fetchAndStoreAnnotations(config, windowId) {
    for (const window of config.windows) {
      if (window.id === windowId && !window.annotations2) {
        try {
          const response = await fetch(window.manifestId);
          const manifest = await response.json();
          if (manifest && manifest.items) {
            const annotations2 = {};
            const annotations3 = {};
            for (const canvas of manifest.items) {
              if (canvas.annotations) {
                const annotationMap = this.processAnnotations(canvas.annotations[0]["items"]);
                annotations2[canvas.id] = annotationMap;
                // annotations3[canvas.id] = annotationMap;

                for (const [cid, xy] of Object.entries(annotationMap)) {
                  annotations3[cid] = xy;
                }


              }
            }
            window.annotations2 = annotations2;
            window.annotations3 = annotations3;
          }
        } catch (error) {
          console.error("Failed to fetch annotations:", error);
        }
      }
    }
  }

  processAnnotations(annotations) {
    const annotationMap = {};
    for (const annotation of annotations) {
      const xywh = annotation.target.split("=")[1].split(",").map(Number);
      annotationMap[annotation.cid] = [
        xywh[0] + xywh[2] / 2,
        xywh[1] + xywh[3] / 2
      ];
    }
    return annotationMap;
  }

  updateGroupWindows(config, groupName) {
    const commonCids = this.findCommonCids(config, groupName);
    for (const window of config.windows) {
      if (window.groupName === groupName) {
        const controlPoints = commonCids.map(cid => window.annotations3[cid]);
        const delaunay = createDelaunay(controlPoints);
        window.data = { controlPoints, delaunay };
      } else {
        window.data = null;
      }
    }
  }

  findCommonCids(config, groupName) {
    const groupWindows = config.windows.filter(window => window.groupName === groupName && window.annotations3);
    if (groupWindows.length === 0) return [];

    const firstWindowAnnotations = groupWindows[0].annotations3;
    return Object.keys(firstWindowAnnotations).filter(cid =>
      groupWindows.every(window => cid in window.annotations3)
    );
  }

  render() {
    const {
      enabled,
      viewer,
      groups,
      groupName,
    } = this.props;

    if (!viewer || !enabled) return null;

    return (
      <React.Fragment>
        <SizeContainer>
          <Root className="MuiPaper-elevation4">
            <React.Fragment>
              <List>

                <ListItem disablePadding onClick={
                  () => this.selectGroup('')
                }>
                  <ListItemButton selected={
                    !groupName
                  }>
                    <DoDisturbIcon style={{ marginRight: 8 }} /> no group
                  </ListItemButton>
                </ListItem>

                {groups.map((group, i) => {
                  const isSelected = group.name === groupName;
                  return (
                    <ListItem disablePadding key={i}>
                      <ListItemButton onClick={
                        () => this.selectGroup(group.name)
                      } selected={
                        isSelected
                      }>
                        {group.name}
                      </ListItemButton>
                    </ListItem>
                  )
                })}
              </List>
            </React.Fragment>
          </Root>
        </SizeContainer>
      </React.Fragment>
    );
  }
}

MiradorSyncWindows.propTypes = {
  enabled: PropTypes.bool,
  size: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  t: PropTypes.func.isRequired,
  updateViewport: PropTypes.func.isRequired,
  updateWindow: PropTypes.func.isRequired,
  viewer: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  viewConfig: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  windowId: PropTypes.string.isRequired,
  groups: PropTypes.array, // eslint-disable-line react/forbid-prop-types
};

MiradorSyncWindows.defaultProps = {
  enabled: true,
  size: {},
  viewer: undefined,
  viewConfig: {},
  groups: [],
};

// Export without wrapping HOC for testing.
export const TestablesyncWindows = MiradorSyncWindows;

export default compose(withSize())(MiradorSyncWindows);
