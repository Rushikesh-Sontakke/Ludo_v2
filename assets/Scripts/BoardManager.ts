// BoardManager.ts
// Holds every tile position on the board and converts a piece's `progress`
// value into a world position. You wire the tile nodes in the editor once,
// then never touch coordinates in code again.
//
// EDITOR SETUP:
//  - mainPath: drag the 52 ring-tile nodes IN ORDER (cell 0 first).
//  - homePaths: 4 elements, each an array of the 6 home-column nodes for that
//    color, ordered from ring-edge inward (index 0 nearest the ring).
//  - baseSlots: 4 elements, each an array of the 4 base/yard slot nodes.
// The tile nodes can be empty cc.Node markers placed over your board image.

import { PlayerColor, ENTRY_OFFSET, RING_SIZE, HOME_PROGRESS } from "./Types";

const { ccclass, property } = cc._decorator;

// Small helper so we can expose 2D arrays in the Inspector (Cocos can't show
// nested arrays directly, so we wrap each row in a component-friendly class).
@ccclass("NodeRow")
export class NodeRow {
    @property([cc.Node])
    nodes: cc.Node[] = [];
}

@ccclass
export default class BoardManager extends cc.Component {

    @property({ type: [cc.Node], tooltip: "52 ring tiles, in order starting at cell 0" })
    mainPath: cc.Node[] = [];

    @property({ type: [NodeRow], tooltip: "4 rows (Red,Blue,Green,Yellow), each 6 home tiles" })
    homePaths: NodeRow[] = [];

    @property({ type: [NodeRow], tooltip: "4 rows (Red,Blue,Green,Yellow), each 4 base slots" })
    baseSlots: NodeRow[] = [];

    // Singleton-ish access for convenience.
    public static instance: BoardManager = null;

    onLoad() {
        BoardManager.instance = this;
        // Sanity warnings so misconfiguration is caught immediately in dev.
        if (this.mainPath.length !== RING_SIZE) {
            cc.warn(`[BoardManager] mainPath has ${this.mainPath.length} tiles, expected ${RING_SIZE}.`);
        }
    }

    /** World position for a base slot (where a piece sits before it leaves). */
    public getBaseWorldPos(color: PlayerColor, pieceIndex: number): cc.Vec3 {
        const node = this.baseSlots[color].nodes[pieceIndex];
        return node.convertToWorldSpaceAR(cc.Vec3.ZERO);
    }

    /**
     * World position for a given progress value (see Types.ts for the model).
     * progress 0 falls back to base slot 0 (caller normally handles base itself).
     */
    public getWorldPosForProgress(color: PlayerColor, progress: number, pieceIndex = 0): cc.Vec3 {
        if (progress <= 0) {
            return this.getBaseWorldPos(color, pieceIndex);
        }
        if (progress <= 51) {
            const absCell = (ENTRY_OFFSET[color] + progress - 1) % RING_SIZE;
            return this.mainPath[absCell].convertToWorldSpaceAR(cc.Vec3.ZERO);
        }
        // Home column: progress 52..57 -> home index 0..5
        const homeIdx = progress - 52;
        return this.homePaths[color].nodes[homeIdx].convertToWorldSpaceAR(cc.Vec3.ZERO);
    }

    /** Absolute ring cell for a progress value, or -1 if not on the ring. */
    public getRingCell(color: PlayerColor, progress: number): number {
        if (progress < 1 || progress > 51) return -1;
        return (ENTRY_OFFSET[color] + progress - 1) % RING_SIZE;
    }

    public isFinished(progress: number): boolean {
        return progress >= HOME_PROGRESS;
    }
}
