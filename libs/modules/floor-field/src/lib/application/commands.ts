import {
  createMessageToken,
  type Command,
  type MessageToken,
} from '@smartbarn/platform-core';
import type { FloorFieldLayer } from '../domain/model';
import type { FloorFieldSide } from '../domain/floor-field';

/** Canonical command tokens owned by the Floor Field bounded context. */
export const floorFieldCommandTokens = {
  resize: createMessageToken('floorField.geometry.command.resize'),
  addLayer: createMessageToken('floorField.layer.command.add'),
  removeLayer: createMessageToken('floorField.layer.command.remove'),
  moveLayer: createMessageToken('floorField.layer.command.move'),
} as const satisfies Readonly<Record<string, MessageToken>>;

/** Changes the rectangular Floor Field dimensions in millimetres. */
export interface ResizeFloorFieldCommand
  extends Command<{ readonly lengthMm: number; readonly widthMm: number }> {
  readonly token: typeof floorFieldCommandTokens.resize;
}

/** Adds a material/construction layer above or below the reference plane. */
export interface AddFloorFieldLayerCommand
  extends Command<{ readonly side: FloorFieldSide; readonly layer: FloorFieldLayer }> {
  readonly token: typeof floorFieldCommandTokens.addLayer;
}

/** Removes one layer identified by its stable layer ID. */
export interface RemoveFloorFieldLayerCommand
  extends Command<{ readonly side: FloorFieldSide; readonly layerId: string }> {
  readonly token: typeof floorFieldCommandTokens.removeLayer;
}

/** Reorders a layer within one side of the reference plane. */
export interface MoveFloorFieldLayerCommand
  extends Command<{
    readonly side: FloorFieldSide;
    readonly fromIndex: number;
    readonly toIndex: number;
  }> {
  readonly token: typeof floorFieldCommandTokens.moveLayer;
}
