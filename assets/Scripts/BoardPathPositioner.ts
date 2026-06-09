// BoardPathPositioner.ts
// Run once in the editor to auto-position all 92 path nodes on the board.
// Attach to the flat_board2 node, check "Position Nodes", then remove the component.
//
// The board is treated as a 15x15 grid (standard Ludo layout):
//   Yellow = top-left  | Blue  = top-right
//   Green  = bot-left  | Red   = bot-right
//
// Ring goes clockwise: Red(0) → Blue(13) → Yellow(26) → Green(39)

const { ccclass, property, executeInEditMode } = cc._decorator;

@ccclass
@executeInEditMode
export default class BoardPathPositioner extends cc.Component {

    @property({ tooltip: "Extra pixels of border/padding on each side of the board image. Increase if pieces land outside the board edge." })
    padding: number = 0;

    @property({ tooltip: "Check this box to instantly position all 92 path nodes." })
    get positionNodes() { return false; }
    set positionNodes(val: boolean) { if (val) this._run(); }

    private _run() {
        if (!CC_EDITOR) return;

        const w = this.node.width  - this.padding * 2;
        const h = this.node.height - this.padding * 2;
        const cellW = w / 15;
        const cellH = h / 15;

        // (col, row) → node-local position. Anchor assumed 0.5, 0.5.
        const toPos = (col: number, row: number): cc.Vec2 => cc.v2(
            -w / 2 + (col + 0.5) * cellW,
             h / 2 - (row + 0.5) * cellH
        );

        const place = (parent: cc.Node, name: string, col: number, row: number) => {
            const node = parent.getChildByName(name);
            if (!node) { cc.warn(`[Positioner] "${name}" not found under "${parent.name}"`); return; }
            const p = toPos(col, row);
            node.x = p.x;
            node.y = p.y;
        };

        // ── 52 main ring cells ───────────────────────────────────────────────
        // Traced clockwise on the 15x15 grid (col, row), origin = top-left.
        // Entry cells: Red=0 (8,13)  Blue=13 (13,6)  Yellow=26 (6,1)  Green=39 (1,8)
        const ring: [number, number][] = [
            // Up right side of bottom arm  → Red entry @ index 0
            [8,13],[8,12],[8,11],[8,10],[8,9],
            // Right arm bottom, going right
            [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
            // Right edge going up
            [14,7],[14,6],
            // Right arm top, going left  → Blue entry @ index 13
            [13,6],[12,6],[11,6],[10,6],[9,6],
            // Top arm right side, going up
            [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
            // Top edge going left
            [7,0],[6,0],
            // Top arm left side, going down  → Yellow entry @ index 26
            [6,1],[6,2],[6,3],[6,4],[6,5],
            // Left arm top, going left
            [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
            // Left edge going down
            [0,7],[0,8],
            // Left arm bottom, going right  → Green entry @ index 39
            [1,8],[2,8],[3,8],[4,8],[5,8],
            // Bottom arm left side, going down
            [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
            // Bottom edge going right
            [7,14],[8,14],
        ];

        const mainPath = this.node.getChildByName("MainPath");
        if (mainPath) {
            ring.forEach(([col, row], i) =>
                place(mainPath, `cell${i.toString().padStart(2, '0')}`, col, row));
            cc.log(`[Positioner] ✓ ${ring.length} ring cells positioned.`);
        } else {
            cc.warn("[Positioner] MainPath node not found under " + this.node.name);
        }

        // ── Home paths (index 0 = nearest ring edge, index 5 = center) ──────
        const homePaths: { name: string; cells: [number, number][] }[] = [
            // Red:    right arm, row 7, going LEFT toward center
            { name: "HomePath_Red",    cells: [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]] },
            // Blue:   top arm,   col 7, going DOWN toward center
            { name: "HomePath_Blue",   cells: [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]] },
            // Green:  bottom arm,col 7, going UP toward center
            { name: "HomePath_Green",  cells: [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]] },
            // Yellow: left arm,  row 7, going RIGHT toward center
            { name: "HomePath_Yellow", cells: [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]] },
        ];

        for (const hp of homePaths) {
            const parent = this.node.getChildByName(hp.name);
            if (!parent) { cc.warn(`[Positioner] "${hp.name}" not found`); continue; }
            hp.cells.forEach(([col, row], i) =>
                place(parent, `cell${i.toString().padStart(2, '0')}`, col, row));
            cc.log(`[Positioner] ✓ ${hp.name} positioned.`);
        }

        // ── Base slots (2×2 arrangement inside each corner circle) ──────────
        const bases: { name: string; slots: [number, number][] }[] = [
            // Red base:    bottom-right corner (cols 9-14, rows 9-14)
            { name: "Base_Red",    slots: [[10,10],[13,10],[10,13],[13,13]] },
            // Blue base:   top-right corner    (cols 9-14, rows 0-5)
            { name: "Base_Blue",   slots: [[10,1],[13,1],[10,4],[13,4]] },
            // Green base:  bottom-left corner  (cols 0-5,  rows 9-14)
            { name: "Base_Green",  slots: [[1,10],[4,10],[1,13],[4,13]] },
            // Yellow base: top-left corner     (cols 0-5,  rows 0-5)
            { name: "Base_Yellow", slots: [[1,1],[4,1],[1,4],[4,4]] },
        ];

        for (const b of bases) {
            const parent = this.node.getChildByName(b.name);
            if (!parent) { cc.warn(`[Positioner] "${b.name}" not found`); continue; }
            b.slots.forEach(([col, row], i) =>
                place(parent, `slot${i}`, col, row));
            cc.log(`[Positioner] ✓ ${b.name} positioned.`);
        }

        cc.log("[BoardPathPositioner] ✓ All 92 nodes positioned! You can now remove this component.");
    }
}
