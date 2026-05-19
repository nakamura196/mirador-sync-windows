const updateAllWindowsBasic = (
  windowId,
  windowGroupId,
  groups,
  windows,
  updateViewport,
  viewConfig,
) => {
  // const groups = syncWindows.groups || [];

  const group = groups.find((g) => g.id === windowGroupId);

  const groupSettings = group ? group.settings : {};

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

      // 追従ウィンドウは即座にスナップさせる。OSD のスプリングアニメーション
      // （既定 ~1.2 秒）を挟むと操作側ウィンドウから遅れて見えるため。
      params.immediately = true;

      updateViewport(window.id, params);
    }
  });
};

export {
  updateAllWindowsBasic,
};
