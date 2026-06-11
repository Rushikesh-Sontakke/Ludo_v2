// AudioManager.ts
// Persistent audio service. Covers the rubric: BGM per scene (2%) + 5 distinct
// SFX (5%). Survives scene loads via cc.game.addPersistRootNode so BGM keeps
// playing across the menu->game transition if you want.
//
// EDITOR SETUP: put this on a node in your first scene. Assign the clips.
// Call AudioManager.instance.playSfx("capture") from anywhere.

const { ccclass, property } = cc._decorator;

@ccclass
export default class AudioManager extends cc.Component {

    @property({ type: cc.AudioClip }) bgmMenu: cc.AudioClip = null;
    @property({ type: cc.AudioClip }) bgmGame: cc.AudioClip = null;

    // The five distinct SFX the rubric asks for.
    @property({ type: cc.AudioClip }) sfxDice: cc.AudioClip = null;
    @property({ type: cc.AudioClip }) sfxMove: cc.AudioClip = null;
    @property({ type: cc.AudioClip }) sfxCapture: cc.AudioClip = null;
    @property({ type: cc.AudioClip }) sfxAbility: cc.AudioClip = null;
    @property({ type: cc.AudioClip }) sfxWin: cc.AudioClip = null;

    @property({ range: [0, 1] }) bgmVolume = 0.6;
    @property({ range: [0, 1] }) sfxVolume = 1.0;

    public static instance: AudioManager = null;
    private _bgmId = -1;

    onLoad() {
        if (AudioManager.instance) { this.node.destroy(); return; } // singleton
        AudioManager.instance = this;
        cc.game.addPersistRootNode(this.node);
    }

    start() {
        // Auto-play menu BGM as soon as the scene loads!
        this.playBgm("menu");
    }

    public playBgm(which: "menu" | "game") {
        const clip = which === "menu" ? this.bgmMenu : this.bgmGame;
        if (!clip) return;
        if (this._bgmId >= 0) cc.audioEngine.stop(this._bgmId);
        this._bgmId = cc.audioEngine.play(clip, true, this.bgmVolume);
    }

    public playSfx(name: "dice" | "move" | "capture" | "ability" | "win") {
        const map = {
            dice: this.sfxDice, move: this.sfxMove, capture: this.sfxCapture,
            ability: this.sfxAbility, win: this.sfxWin,
        };
        const clip = map[name];
        if (clip) cc.audioEngine.play(clip, false, this.sfxVolume);
    }

    // For the Function Menu volume settings (Game Flow rubric).
    public setBgmVolume(v: number) {
        this.bgmVolume = v;
        if (this._bgmId >= 0) cc.audioEngine.setVolume(this._bgmId, v);
    }
    public setSfxVolume(v: number) { this.sfxVolume = v; }
}
