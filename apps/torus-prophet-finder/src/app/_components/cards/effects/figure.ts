import {
  Mesh,
  MeshBasicMaterial,
  Path,
  Shape,
  ShapeGeometry,
  Vector2,
} from "three";

export class Figure extends Mesh {
  constructor() {
    const basePts: Vector2[] = [];
    const cnt = new Vector2();
    const aStep = Math.PI * 0.5;
    (
      [
        [0.5, 5],
        [0.75, 1.5],
        [2.5, 3],
      ] as const
    ).forEach((p, idx, arr) => {
      const arrLen = arr.length * 2;
      const lastIdx = arrLen - 1;
      for (let i = 0; i < 4; i++) {
        const currQuadrant = arrLen * i;
        basePts[currQuadrant + idx] = new Vector2(p[1], p[0]).rotateAround(
          cnt,
          aStep * i,
        );
        basePts[currQuadrant + lastIdx - idx] = new Vector2(
          p[0],
          p[1],
        ).rotateAround(cnt, aStep * i);
      }
    });

    const shape = new Shape(
      [
        [-100, 100],
        [-100, -100],
        [100, -100],
        [100, 100],
      ].map((p) => new Vector2(p[0], p[1])),
    );
    shape.holes.push(new Path(basePts.reverse()));
    const geometry = new ShapeGeometry(shape);
    const material = new MeshBasicMaterial({ color: 0x080808 });
    super(geometry, material);
  }
}

