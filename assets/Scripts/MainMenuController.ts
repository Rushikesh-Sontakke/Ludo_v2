const { ccclass, property } = cc._decorator;

@ccclass
export default class MainMenuController extends cc.Component {

    @property(cc.Label)
    muteLabel: cc.Label = null;

    onLoad() {
        this.updateMuteLabel();
    }

    onLoginClick(): void {
        cc.director.loadScene("LoginScene");
    }

    onRegisterClick(): void {
        cc.director.loadScene("RegisterScene");
    }

    onMuteClick(): void {
        const node = cc.find("BGMManager");
        if (!node) return;
        const mgr = node.getComponent("MenuBGMManager") as any;
        if (!mgr) return;
        mgr.toggleMute();
        this.updateMuteLabel();
    }

    private updateMuteLabel() {
        if (!this.muteLabel) return;
        const node = cc.find("BGMManager");
        if (!node) return;
        const mgr = node.getComponent("MenuBGMManager") as any;
        if (!mgr) return;
        this.muteLabel.string = mgr.isMuted() ? "Music OFF" : "Music ON";
    }
}
