const { ccclass, property } = cc._decorator;

@ccclass
export default class MenuBGMManager extends cc.Component {

    @property(cc.AudioClip)
    bgmClip: cc.AudioClip = null;

    private static _instance: MenuBGMManager = null;
    private _audioID: number = -1;
    private _muted: boolean = false;

    static get instance(): MenuBGMManager {
        return MenuBGMManager._instance;
    }

    onLoad() {
        if (MenuBGMManager._instance !== null) {
            this.node.destroy();
            return;
        }
        MenuBGMManager._instance = this;
        cc.game.addPersistRootNode(this.node);

        const saved = localStorage.getItem("musicMuted");
        this._muted = saved === "true";
    }

    start() {
        this.playBGM();
    }

    playBGM() {
        if (this._audioID !== -1) return;
        if (!this.bgmClip) return;
        this._audioID = cc.audioEngine.play(this.bgmClip, true, this._muted ? 0 : 1);
    }

    stopBGM() {
        if (this._audioID !== -1) {
            cc.audioEngine.stop(this._audioID);
            this._audioID = -1;
        }
    }

    toggleMute(): boolean {
        this._muted = !this._muted;
        localStorage.setItem("musicMuted", String(this._muted));
        if (this._audioID !== -1) {
            cc.audioEngine.setVolume(this._audioID, this._muted ? 0 : 1);
        }
        return this._muted;
    }

    isMuted(): boolean {
        return this._muted;
    }
}
