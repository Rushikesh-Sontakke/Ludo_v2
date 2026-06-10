const { ccclass, property, executeInEditMode } = cc._decorator;

@ccclass
@executeInEditMode
export default class BoardPathGenerator extends cc.Component {

    @property({ tooltip: "Width of a single tile in pixels. Usually BoardWidth / 15." })
    tileSize: number = 46.7;

    @property({ tooltip: "X offset to perfectly center the grid over the board art." })
    offsetX: number = 0;

    @property({ tooltip: "Y offset to perfectly center the grid over the board art." })
    offsetY: number = 0;

    @property({
        tooltip: "Check this box to instantly generate and position all 92 path nodes!"
    })
    get generate() { return false; }
    set generate(val) {
        if (val) this.createNodes();
    }

    createNodes() {
        if (!CC_EDITOR) return;

        let boardNode = this.node;
        // Clean up old ones first so we don't double up
        boardNode.removeAllChildren();

        const ts = this.tileSize;
        const ox = this.offsetX;
        const oy = this.offsetY;

        // 1. Main Path (52 cells)
        const mainGrid = [
            { x: 6, y: -1 }, { x: 5, y: -1 }, { x: 4, y: -1 }, { x: 3, y: -1 }, { x: 2, y: -1 },
            { x: 1, y: -2 }, { x: 1, y: -3 }, { x: 1, y: -4 }, { x: 1, y: -5 }, { x: 1, y: -6 }, { x: 1, y: -7 },
            { x: 0, y: -7 },
            { x: -1, y: -7 }, { x: -1, y: -6 }, { x: -1, y: -5 }, { x: -1, y: -4 }, { x: -1, y: -3 }, { x: -1, y: -2 },
            { x: -2, y: -1 }, { x: -3, y: -1 }, { x: -4, y: -1 }, { x: -5, y: -1 }, { x: -6, y: -1 }, { x: -7, y: -1 },
            { x: -7, y: 0 },
            { x: -7, y: 1 }, { x: -6, y: 1 }, { x: -5, y: 1 }, { x: -4, y: 1 }, { x: -3, y: 1 }, { x: -2, y: 1 },
            { x: -1, y: 2 }, { x: -1, y: 3 }, { x: -1, y: 4 }, { x: -1, y: 5 }, { x: -1, y: 6 }, { x: -1, y: 7 },
            { x: 0, y: 7 },
            { x: 1, y: 7 }, { x: 1, y: 6 }, { x: 1, y: 5 }, { x: 1, y: 4 }, { x: 1, y: 3 }, { x: 1, y: 2 },
            { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 },
            { x: 7, y: 0 },
            { x: 7, y: -1 }
        ];

        let mainPath = new cc.Node("MainPath");
        mainPath.parent = boardNode;
        for (let i = 0; i < 52; i++) {
            let cell = new cc.Node(`cell${i.toString().padStart(2, '0')}`);
            cell.parent = mainPath;
            cell.x = ox + (mainGrid[i].x * ts);
            cell.y = oy + (mainGrid[i].y * ts);
        }

        // 2. Home Paths
        const colors = ["Red", "Blue", "Green", "Yellow"];
        const homeGrids = {
            Red: [{ x: 6, y: 0 }, { x: 5, y: 0 }, { x: 4, y: 0 }, { x: 3, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 0 }],
            Green: [{ x: 0, y: -6 }, { x: 0, y: -5 }, { x: 0, y: -4 }, { x: 0, y: -3 }, { x: 0, y: -2 }, { x: 0, y: -1 }],
            Yellow: [{ x: -6, y: 0 }, { x: -5, y: 0 }, { x: -4, y: 0 }, { x: -3, y: 0 }, { x: -2, y: 0 }, { x: -1, y: 0 }],
            Blue: [{ x: 0, y: 6 }, { x: 0, y: 5 }, { x: 0, y: 4 }, { x: 0, y: 3 }, { x: 0, y: 2 }, { x: 0, y: 1 }]
        };

        colors.forEach(color => {
            let homePath = new cc.Node(`HomePath_${color}`);
            homePath.parent = boardNode;
            let grid = homeGrids[color];
            for (let i = 0; i < 6; i++) {
                let cell = new cc.Node(`cell${i.toString().padStart(2, '0')}`);
                cell.parent = homePath;
                cell.x = ox + (grid[i].x * ts);
                cell.y = oy + (grid[i].y * ts);
            }
        });

        // 3. Base Slots
        const baseCenters = {
            Red: { x: 4.5, y: -4.5 },
            Green: { x: -4.5, y: -4.5 },
            Yellow: { x: -4.5, y: 4.5 },
            Blue: { x: 4.5, y: 4.5 }
        };
        const slotOffsets = [{ x: -1, y: 1 }, { x: 1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }];

        colors.forEach(color => {
            let baseNode = new cc.Node(`Base_${color}`);
            baseNode.parent = boardNode;
            let center = baseCenters[color];
            for (let i = 0; i < 4; i++) {
                let slot = new cc.Node(`slot${i}`);
                slot.parent = baseNode;
                slot.x = ox + ((center.x + slotOffsets[i].x) * ts);
                slot.y = oy + ((center.y + slotOffsets[i].y) * ts);
            }
        });

        cc.log("SUCCESS: 92 path nodes mathematically positioned on the 15x15 Ludo grid!");
    }
}
