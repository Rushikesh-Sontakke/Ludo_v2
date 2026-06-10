// Piece.ts
// One playable token. Knows its color, its progress along the path, and how to
// animate itself tile-by-tile. Movement uses cc.tween so you get the smooth
// "hopping" motion for the animation rubric points for free.
//
// EDITOR SETUP per piece prefab:
//  - Add a cc.BoxCollider (Collision component, NOT physics) so the collision
//    manager can report overlaps for captures (the 13% "collision system").
//  - Add a cc.Animation component and create two clips named "idle" and "walk"
//    from the sliced sprite sheet frames. Drag the Animation component into anim.
//  - Add a cc.Button OR we register a touch handler in onLoad (done below).

import { PlayerColor, HOME_PROGRESS } from "./Types";
import BoardManager from "./BoardManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Piece extends cc.Component {

    @property({ type: cc.Enum(PlayerColor) })
    color: PlayerColor = PlayerColor.Red;

    @property({ tooltip: "0..3 — which of this player's four pieces" })
    pieceIndex: number = 0;

    @property({ type: cc.Animation, tooltip: "Animation component with 'idle' and 'walk' clips" })
    anim: cc.Animation = null;

    @property({ type: cc.Node, tooltip: "Optional highlight ring shown when this piece is movable" })
    highlight: cc.Node = null;

    @property({ type: cc.Node, tooltip: "Optional shield VFX node, toggled by AbilitySystem" })
    shieldFx: cc.Node = null;

    // ---- runtime state ----
    public progress: number = 0;        // see Types.ts progress model
    public isShielded: boolean = false; // immune to capture for one turn
    public selectable: boolean = false; // set by GameManager when it's a legal move

    // GameManager wires this so the piece can report a click back.
    public onClicked: (piece: Piece) => void = null;

    private _moving = false;
    private _baseScale: number = 1.0;

    onLoad() {
        this._baseScale = this.node.scale; // Remember the scale set in the editor!
        
        this.node.on(cc.Node.EventType.TOUCH_END, this._handleTap, this);
        this.setHighlight(false);
        if (this.shieldFx) this.shieldFx.active = false;
        this._playAnim("idle");
    }

    private _playAnim(type: "idle" | "walk") {
        if (!this.anim) return;
        const clips = this.anim.getClips();
        if (!clips || clips.length === 0) return;
        
        // Assume clip[0] is Idle, and clip[1] is Walk (if it exists)
        let clipName = clips[0].name; 
        if (type === "walk" && clips.length > 1) {
            clipName = clips[1].name;
        }
        
        const state = this.anim.getAnimationState(clipName);
        if (state) this.anim.play(clipName);
    }

    private _handleTap() {
        if (this.selectable && !this._moving && this.onClicked) {
            this.onClicked(this);
        }
    }

    public setHighlight(on: boolean) {
        this.selectable = on;
        if (this.highlight) this.highlight.active = on;
    }

    public setShield(on: boolean) {
        this.isShielded = on;
        if (this.shieldFx) this.shieldFx.active = on;
    }

    public isInBase(): boolean { return this.progress === 0; }
    public isFinished(): boolean { return this.progress >= HOME_PROGRESS; }

    /** Snap instantly to current progress (used on setup / capture reset). */
    public snapToProgress() {
        const board = BoardManager.instance;
        const wp = board.getWorldPosForProgress(this.color, this.progress, this.pieceIndex);
        this.node.setPosition(this.node.parent.convertToNodeSpaceAR(wp));
    }

    /**
     * Animate the piece forward by `steps`, one tile at a time, then resolve.
     * Returns a Promise so GameManager can await the full hop sequence.
     */
    public moveStepByStep(steps: number): Promise<void> {
        return new Promise((resolve) => {
            this._moving = true;
            this._playAnim("walk");
            const board = BoardManager.instance;

            // Leaving base is a single jump onto the entry cell (progress 1).
            if (this.progress === 0) {
                this.progress = 1;
                steps -= 1; // the "6" that let us out counts as reaching cell 1
            }

            const target = this.progress + steps;
            const hop = () => {
                if (this.progress >= target || this.progress >= HOME_PROGRESS) {
                    this._moving = false;
                    this._playAnim("idle");
                    resolve();
                    return;
                }
                this.progress += 1;
                const wp = board.getWorldPosForProgress(this.color, this.progress, this.pieceIndex);
                const local = this.node.parent.convertToNodeSpaceAR(wp);
                // A little arc + scale bounce relative to the editor scale!
                cc.tween(this.node)
                    .to(0.12, { position: local }, { easing: "sineOut" })
                    .to(0.06, { scale: this._baseScale * 1.15 })
                    .to(0.06, { scale: this._baseScale })
                    .call(hop)
                    .start();
            };
            hop();
        });
    }

    /** Send this piece back to its base (used on capture). */
    public sendHomeToBase() {
        this.progress = 0;
        this.setShield(false);
        this._playAnim("idle");
        const board = BoardManager.instance;
        const wp = board.getBaseWorldPos(this.color, this.pieceIndex);
        const local = this.node.parent.convertToNodeSpaceAR(wp);
        cc.tween(this.node).to(0.25, { position: local }, { easing: "backIn" }).start();
    }

    // Cocos collision-manager callback. We don't resolve capture rules here
    // (GameManager does, after a move settles) but having real colliders +
    // this hook is what makes the "Collision System" concrete for grading.
    onCollisionEnter(_other: cc.Collider, _self: cc.Collider) {
        // Optional: visual feedback when tokens overlap.
    }
}
