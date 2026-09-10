import * as THREE from 'three';
import type { FloorFieldModel } from '@smartbarn/domain';

const MM_TO_M = 0.001;

export function floorFieldToObject3D(model: FloorFieldModel): THREE.Group {
  const group = new THREE.Group();
  group.name = model.id;

  const width = model.geometry.widthMm * MM_TO_M;
  const length = model.geometry.lengthMm * MM_TO_M;

  let zTop = 0;
  for (const layer of model.layers) {
    const thickness = layer.thicknessMm * MM_TO_M;
    const geometry = new THREE.BoxGeometry(length, thickness, width);
    const material = new THREE.MeshStandardMaterial({ color: layer.color ?? '#94a3b8' });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.name = layer.id;
    mesh.userData['smartBarnLayerId'] = layer.id;
    mesh.position.y = zTop - thickness / 2;
    group.add(mesh);

    zTop -= thickness;
  }

  return group;
}
