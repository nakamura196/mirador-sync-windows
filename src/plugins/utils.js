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

function transformPointAndCalculateZoom(
  point,
  delaunay1,
  controlPointsImage1,
  controlPointsImage2,
) {
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

  return { transformedPoint, zoomRatio: averageRatio };
}

function createDelaunay(controlPoints) {
  return Delaunay.from(controlPoints);
}

export { createDelaunay, transformPointAndCalculateZoom };
