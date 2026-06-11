const { ccclass } = cc._decorator;

@ccclass
export default class GameInit extends cc.Component {

    onLoad() {
        const node = cc.find("BGMManager");
        if (node) {
            const mgr = node.getComponent("MenuBGMManager") as any;
            if (mgr) mgr.stopBGM();
        }
    }
}
