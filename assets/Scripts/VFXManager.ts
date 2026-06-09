// VFXManager.ts
// Spawns particle effects for the "5 different particle effects" rubric line (5%).
// Listens to game events and plays a one-shot cc.ParticleSystem at a position.
//
// EDITOR SETUP: create 5 particle prefabs (capture, ability, diceLand, win, home)
// each with a cc.ParticleSystem set to NOT auto-remove-on-finish, and assign them.

import GameManager from "./GameManager";
import { GameEvent } from "./Types";
import Piece from "./Piece";

const { ccclass, property } = cc._decorator;

@ccclass
export default class VFXManager extends cc.Component {

    @property({ type: GameManager }) game: GameManager = null;

    @property({ type: cc.Prefab }) captureFx: cc.Prefab = null; // burst on capture
    @property({ type: cc.Prefab }) abilityFx: cc.Prefab = null; // sparkle on ability
    @property({ type: cc.Prefab }) diceFx: cc.Prefab = null;    // dust when dice lands
    @property({ type: cc.Prefab }) winFx: cc.Prefab = null;     // confetti on win
    @property({ type: cc.Prefab }) homeFx: cc.Prefab = null;    // sparkle reaching home

    @property({ type: cc.Node, tooltip: "Layer to parent spawned effects under" })
    fxLayer: cc.Node = null;

    onLoad() {
        const ev = this.game.events;
        ev.on(GameEvent.PIECE_CAPTURED, (p: Piece) => this._spawnAt(this.captureFx, p.node), this);
        ev.on(GameEvent.PIECE_HOME, (p: Piece) => this._spawnAt(this.homeFx, p.node), this);
        ev.on(GameEvent.ABILITY_USED, () => this._spawnAtPos(this.abilityFx, cc.v3(0, 0)), this);
        ev.on(GameEvent.DICE_ROLLED, () => this._spawnAtPos(this.diceFx, cc.v3(0, 0)), this);
        ev.on(GameEvent.GAME_WON, () => this._spawnAtPos(this.winFx, cc.v3(0, 200)), this);
    }

    private _spawnAt(prefab: cc.Prefab, near: cc.Node) {
        if (!prefab || !near) return;
        const wp = near.convertToWorldSpaceAR(cc.Vec3.ZERO);
        this._spawnAtPos(prefab, this.fxLayer.convertToNodeSpaceAR(wp));
    }

    private _spawnAtPos(prefab: cc.Prefab, localPos: cc.Vec3) {
        if (!prefab) return;
        const fx = cc.instantiate(prefab);
        (this.fxLayer || this.node).addChild(fx);
        fx.setPosition(localPos);
        const ps = fx.getComponent(cc.ParticleSystem);
        if (ps) ps.resetSystem();
        // Clean up after the effect finishes.
        this.scheduleOnce(() => fx.isValid && fx.destroy(), 2);
    }
}
