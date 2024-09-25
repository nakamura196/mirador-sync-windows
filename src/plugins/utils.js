import { Delaunay } from 'd3-delaunay';

// 重複計算を避けるために一つの関数でチェックと座標計算を行います
function calculateTriangleProperties(px, py, ax, ay, bx, by, cx, cy) {
  const v0 = [cx - ax, cy - ay];
  const v1 = [bx - ax, by - ay];
  const v2 = [px - ax, py - ay];

  const dot00 = v0[0] * v0[0] + v0[1] * v0[1];
  const dot01 = v0[0] * v1[0] + v0[1] * v1[1];
  const dot02 = v0[0] * v2[0] + v0[1] * v2[1];
  const dot11 = v1[0] * v1[0] + v1[1] * v1[1];
  const dot12 = v1[0] * v2[0] + v1[1] * v2[1];

  const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
  const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
  const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
  const isInTriangle = u >= 0 && v >= 0 && u + v < 1;

  return { isInTriangle, barycentricCoordinates: [1 - u - v, v, u] };
}

function getDistancesToVertices(px, py, ax, ay, bx, by, cx, cy) {
  const distanceA = Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
  const distanceB = Math.sqrt((px - bx) ** 2 + (py - by) ** 2);
  const distanceC = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
  return [distanceA, distanceB, distanceC];
}

function calcAverageRatio(
  point,
  transformedPoint,
  controlPointsImage1,
  controlPointsImage2,
  i,
  j,
  k,
) {
  const ax2 = controlPointsImage2[i][0]; const
    ay2 = controlPointsImage2[i][1];
  const bx2 = controlPointsImage2[j][0]; const
    by2 = controlPointsImage2[j][1];
  const cx2 = controlPointsImage2[k][0]; const
    cy2 = controlPointsImage2[k][1];

  const ax1 = controlPointsImage1[i][0]; const
    ay1 = controlPointsImage1[i][1];
  const bx1 = controlPointsImage1[j][0]; const
    by1 = controlPointsImage1[j][1];
  const cx1 = controlPointsImage1[k][0]; const
    cy1 = controlPointsImage1[k][1];

  const distances1 = getDistancesToVertices(
    point[0],
    point[1],
    ax1,
    ay1,
    bx1,
    by1,
    cx1,
    cy1,
  );

  const distances2 = getDistancesToVertices(
    transformedPoint[0],
    transformedPoint[1],
    ax2,
    ay2,
    bx2,
    by2,
    cx2,
    cy2,
  );

  let totalRatio = 0;
  for (let n = 0; n < distances1.length; n += 1) {
    totalRatio += distances2[n] / distances1[n];
  }

  const averageRatio = totalRatio / distances1.length;
  return averageRatio;
}

/**
 * ベクトルの回転角度を計算する関数
 * @param {Array} v1 - 変換前のベクトル (例: [x1, y1])
 * @param {Array} v2 - 変換後のベクトル (例: [x2, y2])
 * @returns {number} - ベクトル間の回転角度 (度)
 */
function calculateRotationAngle(p11, p21, p12, p22) {
  // ベクトル1の計算 (変換前)
  const vec1x = p21[0] - p11[0];
  const vec1y = p21[1] - p11[1];
  // ベクトル2の計算 (変換後)
  const vec2x = p22[0] - p12[0];
  const vec2y = p22[1] - p12[1];

  // 内積を計算
  const dotProduct = vec1x * vec2x + vec1y * vec2y;
  // ベクトルの長さの積
  const mag1 = Math.sqrt(vec1x * vec1x + vec1y * vec1y);
  const mag2 = Math.sqrt(vec2x * vec2x + vec2y * vec2y);

  // コサイン値 (内積 / 長さの積)
  const cosTheta = dotProduct / (mag1 * mag2);

  // アークコサインで角度を取得 (ラジアン)
  let angle = Math.acos(Math.min(Math.max(cosTheta, -1), 1)); // 範囲を [-1, 1] に制限

  // 外積を用いて符号を決定 (右回りか左回りか)
  const crossProduct = vec1x * vec2y - vec1y * vec2x;
  if (crossProduct < 0) {
    angle = -angle; // 時計回りの場合は負の角度にする
  }

  // 角度をラジアンから度に変換
  return angle * (180 / Math.PI);
}

function transformPointAndCalculateZoom(
  point,
  delaunay1,
  controlPointsImage1,
  controlPointsImage2,
  size1,
  size2,
) {
  if (!point[0] || !point[1]) {
    return null;
  }

  const closestPointIndex = delaunay1.find(point[0], point[1]);
  const neighbors = [...delaunay1.neighbors(closestPointIndex)];

  let triangleFound = false;
  let barycentric; let i; let j; let
    k;

  for (let n = 0; n < neighbors.length && !triangleFound; n += 1) {
    i = closestPointIndex;
    j = neighbors[n];
    k = neighbors[(n + 1) % neighbors.length];

    const p0 = controlPointsImage1[i];
    const p1 = controlPointsImage1[j];
    const p2 = controlPointsImage1[k];

    if (p0 && p1 && p2) {
      const result = calculateTriangleProperties(
        point[0],
        point[1],
        p0[0],
        p0[1],
        p1[0],
        p1[1],
        p2[0],
        p2[1],
      );
      if (result.isInTriangle) {
        barycentric = result.barycentricCoordinates;
        triangleFound = true;
      }
    }
  }

  if (!triangleFound) return null;

  const transformedPoint = [
    barycentric[0] * controlPointsImage2[i][0]
    + barycentric[1] * controlPointsImage2[j][0]
    + barycentric[2] * controlPointsImage2[k][0],
    barycentric[0] * controlPointsImage2[i][1]
    + barycentric[1] * controlPointsImage2[j][1]
    + barycentric[2] * controlPointsImage2[k][1],
  ];
  const averageRatio = calcAverageRatio(
    point,
    transformedPoint,
    controlPointsImage1,
    controlPointsImage2,
    i,
    j,
    k,
  );

  const rotationAngle = calculateRotationAngle(
    controlPointsImage1[i],
    controlPointsImage1[j],
    controlPointsImage2[i],
    controlPointsImage2[j],
  );

  return { transformedPoint, zoomRatio: averageRatio * size1 / size2, rotationAngle };
}

function createDelaunay(controlPoints) {
  const delaunay = Delaunay.from(controlPoints);
  return delaunay;
}

function findCommonCids(windows, groupId) {
  const groupWindows = windows.filter(
    (window) => window.windowGroupId === groupId,
  );
  if (groupWindows.length === 0) return [];

  const queryWindow = groupWindows[0];

  if (!queryWindow.data) return [];

  const { canvasCidMap } = queryWindow.data;

  if (!canvasCidMap) return [];

  // 3. queryWindowのcanvasCidMapを取得
  const firstWindowAnnotations = canvasCidMap[queryWindow.data.canvasId];

  // 4. 共通CIDのフィルタリング開始
  const commonCids = Object.keys(firstWindowAnnotations).filter((cid) => {
    const isCommon = groupWindows.every((window) => {
      const cids = window.data.canvasCidMap[window.data.canvasId] || {};
      const hasCid = cid in cids;
      return hasCid;
    });
    return isCommon;
  });

  return commonCids;
}

function getJSONFromQuery() {
  // eslint-disable-next-line no-undef
  const urlParams = new URLSearchParams(window.location.search);
  const configParam = urlParams.get('config');

  if (!configParam) {
    return null; // クエリパラメータに JSON がない場合は null を返す
  }

  try {
    // JSON をデコードしてオブジェクトに変換
    return JSON.parse(decodeURIComponent(configParam));
  } catch (error) {
    console.error('Invalid JSON in query parameter:', error);
    return null;
  }
}

/**
 * 与えられた windows 配列を特定の形式で横一列に並べる Mirador の workspace layout を再帰的に生成する関数
 * @param {Array} windows - 横に並べたいウィンドウの配列（各ウィンドウは id を持つ）
 * @param {number} [parentSplit=100] - 親の分割割合 (デフォルトは100%)
 * @returns {Object} Mirador workspace layout 設定
 */
function generateCustomRecursiveLayout(windows, parentSplit = 100) {
  if (windows.length === 0) return null;

  // ウィンドウが1つしかない場合、そのウィンドウのみを配置
  if (windows.length === 1) {
    return {
      direction: 'row',
      first: windows[0].id,
      splitPercentage: parentSplit,
    };
  }

  // ウィンドウが2つ以上ある場合、再帰的にレイアウトを構築
  const [firstWindow, secondWindow, ...remainingWindows] = windows;

  // 2つ以上のウィンドウがある場合、親の splitPercentage を均等に配分
  const splitPercentage = parentSplit / windows.length;

  const layout = {
    direction: 'row',
    first: firstWindow.id, // 最初のウィンドウを first に配置
    second: secondWindow.id, // 2番目のウィンドウを second に配置
  };

  // 残りのウィンドウがある場合、再帰的に構造をネスト
  if (remainingWindows.length > 0) {
    layout.second = generateCustomRecursiveLayout(
      [secondWindow, ...remainingWindows],
      parentSplit - splitPercentage,
    ); // 再帰的に残りのウィンドウをネスト
    layout.splitPercentage = splitPercentage;
  }

  return layout;
}

const getWindowData = async (manifestId) => {
  let data = {

  };
  try {
    const response = await fetch(manifestId);
    const manifest = await response.json();
    if (manifest && manifest.items) {
      const canvasCidMap = {};
      const canvasSizeMap = {};

      manifest.items.forEach((canvas) => {
        const maxCanvasLength = Math.max(canvas.width, canvas.height);
        canvasSizeMap[canvas.id] = maxCanvasLength;

        if (canvas.annotations) {
          const annotationMap = {};
          canvas.annotations[0].items.forEach((annotation) => {
            annotationMap[annotation.id] = annotation;
          });

          const cidMap = {};

          Object.entries(annotationMap).forEach(([_, annotation]) => {
            if (annotation.cid) {
              const xywh = annotation.target
                .split('=')[1]
                .split(',')
                .map(Number);
              const x = xywh[0] + xywh[2] / 2;
              const y = xywh[1] + xywh[3] / 2;
              cidMap[annotation.cid] = [x, y];
            }
          });

          canvasCidMap[canvas.id] = cidMap;
        }
      });

      data = {
        canvasCidMap,
        canvasSizeMap,
      };
    }
  } catch (error) {
    console.error(
      `Error fetching or processing manifest ${manifestId}:`,
      error,
    );
  }

  return data;
};

export {
  createDelaunay,
  transformPointAndCalculateZoom,
  findCommonCids,
  getJSONFromQuery, generateCustomRecursiveLayout,
  getWindowData,
};
