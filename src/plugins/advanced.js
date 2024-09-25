import {
  findCommonCids, getWindowData, createDelaunay, transformPointAndCalculateZoom,
} from './utils';

const getWindowsWithManifestData = async (windows, windowGroupId) => {
  const updatedWindows = await Promise.all(
    windows.map(async (window) => {
      if (window.windowGroupId === windowGroupId) {
        if (!window.data) {
          const data = await getWindowData(window.manifestId);
          return { ...window, data };
        }
      }
      return window;
    }),
  );

  return updatedWindows;
};

const checkNeedUpdate = (windows, windowGroupId) => {
  let isNeedUpdate = false;

  const windowsCanvasAdded = windows.map((window) => {
    if (window.windowGroupId === windowGroupId) {
      const { visibleCanvases } = window; // windowsAll[window.id];

      if (!window.data.controlPoints) {
        isNeedUpdate = true;
        return {
          ...window,
          data: {
            ...window.data,
            canvasId: visibleCanvases
              ? visibleCanvases[0] : null, // Update the canvasId to the first visible canvas.
          },
        };
      } if (!visibleCanvases.includes(window.data.canvasId)) {
        isNeedUpdate = true;
        return {
          ...window,
          data: {
            ...window.data,
            canvasId: visibleCanvases[0], // Update the canvasId to the first visible canvas.
          },
        };
      }
      return window; // Return unchanged window if conditions are not met.
    }

    return window; // Return unchanged window if conditions are not met.
  });

  return {
    isNeedUpdate,
    windowsCanvasAdded,
  };
};

const calcCanvasData = (windows, windowGroupId) => {
  const commonCids = findCommonCids(windows, windowGroupId);

  const updatedWindows2 = windows.map((window) => {
    if (window.windowGroupId === windowGroupId) {
      if (!window.data) return window;

      const targetCanvasId = window.data.canvasId;

      if (!targetCanvasId) return window;

      const { canvasCidMap } = window.data;

      if (!canvasCidMap) return window;

      const canvasTargetCidMap = canvasCidMap[targetCanvasId];

      if (!canvasTargetCidMap) return window;

      const controlPoints = commonCids.map(
        (cid) => canvasTargetCidMap[cid],
      );
      const size = window.data.canvasSizeMap[targetCanvasId];

      return {
        ...window,
        data: {
          ...window.data,
          controlPoints,
          size,
        },
      };
    }

    return window;
  });

  return updatedWindows2;
};

const updateWindowsWithTransform = async (
  windowId,
  windowGroupId,
  centerImage,
  updateViewport,
  groups,
  windows,
  updateWorkspace,
  viewConfig,
) => {
  const windowsDataAdded = await getWindowsWithManifestData(windows, windowGroupId);

  const { isNeedUpdate, windowsCanvasAdded } = checkNeedUpdate(windowsDataAdded, windowGroupId);

  let finalWindows = [];

  if (isNeedUpdate) {
    finalWindows = calcCanvasData(windowsCanvasAdded, windowGroupId);
  } else {
    finalWindows = windowsCanvasAdded;
  }

  // main

  const group = groups.find((g) => g.id === windowGroupId);

  const groupSettings = group ? group.settings : {};

  const sourceWindow = finalWindows.find((window) => window.id === windowId);

  if (!sourceWindow || !sourceWindow.data) return;

  const { controlPoints: controlPointsImage1 } = sourceWindow.data;

  if (!controlPointsImage1) return;

  const delaunay = createDelaunay(controlPointsImage1);

  finalWindows.forEach((targetWindow) => {
    if (targetWindow.id !== windowId && targetWindow.windowGroupId === windowGroupId) {
      if (!targetWindow.data) return;

      const controlPointsImage2 = targetWindow.data.controlPoints;

      const transformResult = transformPointAndCalculateZoom(
        [centerImage.x, centerImage.y],
        delaunay,
        controlPointsImage1,
        controlPointsImage2,
        sourceWindow.data.size,
        targetWindow.data.size,
      );

      if (transformResult) {
        const { transformedPoint, zoomRatio, rotationAngle } = transformResult;

        const params = {};

        if (groupSettings.zoom) {
          [params.x, params.y] = transformedPoint;
          params.zoom = zoomRatio * viewConfig.zoom;
        }

        if (groupSettings.rotation) {
          // 要調整
          params.rotation = viewConfig.rotation + rotationAngle; // viewConfig.rotation;
        }

        // params.immediately = true;

        updateViewport(targetWindow.id, params);
      }
    }
  });

  if (isNeedUpdate) {
    updateWorkspace({
      syncWindows: {
        groups,
        windows: finalWindows.reduce((acc, window) => {
          acc[window.id] = { ...window };
          return acc;
        }, {}),
      },
    });
  }
};

export {
  updateWindowsWithTransform,
};
