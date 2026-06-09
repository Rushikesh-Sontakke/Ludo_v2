const {ccclass, property, executeInEditMode} = cc._decorator;

@ccclass
@executeInEditMode
export default class BoardPathGenerator extends cc.Component {

    @property({
        tooltip: "Check this box to instantly generate all 92 required path nodes!"
    })
    get generate() {
        return false;
    }
    set generate(val) {
        if (val) {
            this.createNodes();
        }
    }

    createNodes() {
        // Only run in editor to prevent accidents at runtime
        if (!CC_EDITOR) return;

        let boardNode = this.node;

        // 1. Main Path (52 cells)
        let mainPath = new cc.Node("MainPath");
        mainPath.parent = boardNode;
        for (let i = 0; i < 52; i++) {
            let cell = new cc.Node(`cell${i.toString().padStart(2, '0')}`);
            cell.parent = mainPath;
        }

        // 2. Home Paths (4 colors x 6 cells)
        const colors = ["Red", "Blue", "Green", "Yellow"];
        colors.forEach(color => {
            let homePath = new cc.Node(`HomePath_${color}`);
            homePath.parent = boardNode;
            for (let i = 0; i < 6; i++) {
                let cell = new cc.Node(`cell${i.toString().padStart(2, '0')}`);
                cell.parent = homePath;
            }
        });

        // 3. Base Slots (4 colors x 4 slots)
        colors.forEach(color => {
            let baseNode = new cc.Node(`Base_${color}`);
            baseNode.parent = boardNode;
            for (let i = 0; i < 4; i++) {
                let slot = new cc.Node(`slot${i}`);
                slot.parent = baseNode;
            }
        });

        cc.log("SUCCESS: Generated all 92 path nodes! You can now position them over your board tiles.");
    }
}
