// UIManager.ts
// Drives the Game Flow rubric (10%): opening animation, menus, pause/continue,
// win/fail screen, return-to-home, and scene transitions. Lives in the Game
// scene and listens to GameManager events.
//
// EDITOR SETUP: assign the overlay nodes and hook buttons to the on* methods.

import GameManager from "./GameManager";
import AudioManager from "./AudioManager";
import { GameEvent, PlayerColor } from "./Types";

const { ccclass, property } = cc._decorator;

@ccclass
export default class UIManager extends cc.Component {

    @property({ type: GameManager }) game: GameManager = null;

    @property({ type: cc.Node }) pausePanel: cc.Node = null;
    @property({ type: cc.Node }) winPanel: cc.Node = null;
    @property({ type: cc.Label }) winLabel: cc.Label = null;
    @property({ type: cc.Label }) turnLabel: cc.Label = null;
    @property({ type: cc.Label }) diceLabel: cc.Label = null;
    @property({ type: cc.Node }) fadeOverlay: cc.Node = null; // full-screen black sprite

    private _paused = false;

    onLoad() {
        if (this.pausePanel) this.pausePanel.active = false;
        if (this.winPanel) this.winPanel.active = false;

        const ev = this.game.events;
        ev.on(GameEvent.TURN_CHANGED, this._onTurnChanged, this);
        ev.on(GameEvent.DICE_ROLLED, this._onDiceRolled, this);
        ev.on(GameEvent.PIECE_CAPTURED, () => AudioManager.instance && AudioManager.instance.playSfx("capture"), this);
        ev.on(GameEvent.ABILITY_USED, () => AudioManager.instance && AudioManager.instance.playSfx("ability"), this);
        ev.on(GameEvent.GAME_WON, this._onGameWon, this);
    }

    start() {
        if (AudioManager.instance) AudioManager.instance.playBgm("game");
        this._playTransitionIn(); // fade from black = transition animation (2%)
    }

    // ---- event handlers ----
    private _onTurnChanged(color: PlayerColor) {
        if (this.turnLabel) this.turnLabel.string = `Turn: ${PlayerColor[color]}`;
    }
    private _onDiceRolled(value: number) {
        if (this.diceLabel) this.diceLabel.string = `${value}`;
        if (AudioManager.instance) AudioManager.instance.playSfx("dice");
    }
    private _onGameWon(color: PlayerColor) {
        if (AudioManager.instance) AudioManager.instance.playSfx("win");
        if (this.winLabel) this.winLabel.string = `${PlayerColor[color]} wins!`;
        if (this.winPanel) {
            this.winPanel.active = true;
            this.winPanel.scale = 0;
            cc.tween(this.winPanel).to(0.4, { scale: 1 }, { easing: "backOut" }).start(); // end animation (2%)
        }
    }

    // ---- buttons ----
    public onRollPressed() { if (!this._paused) this.game.onRollPressed(); }

    public onPausePressed() {
        this._paused = !this._paused;
        if (this.pausePanel) this.pausePanel.active = this._paused;
        cc.director[this._paused ? "pause" : "resume"]();
    }

    public onResumePressed() {
        this._paused = false;
        if (this.pausePanel) this.pausePanel.active = false;
        cc.director.resume();
    }

    public onReturnHome() { this._transitionToScene("Main"); }
    public onPlayAgain() { this._transitionToScene("Game"); } // replayable (rubric red note)

    // ---- transitions ----
    private _playTransitionIn() {
        if (!this.fadeOverlay) return;
        this.fadeOverlay.active = true;
        this.fadeOverlay.opacity = 255;
        cc.tween(this.fadeOverlay)
            .to(0.5, { opacity: 0 })
            .call(() => this.fadeOverlay.active = false)
            .start();
    }

    private _transitionToScene(scene: string) {
        cc.director.resume();
        if (!this.fadeOverlay) { cc.director.loadScene(scene); return; }
        this.fadeOverlay.active = true;
        this.fadeOverlay.opacity = 0;
        cc.tween(this.fadeOverlay)
            .to(0.4, { opacity: 255 })
            .call(() => cc.director.loadScene(scene))
            .start();
    }
}
