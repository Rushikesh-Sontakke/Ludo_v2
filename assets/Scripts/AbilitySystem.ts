// AbilitySystem.ts
// Three "operations other than moving" for the 9% rubric line:
//   1) Shield      - protect a chosen piece from capture until your next turn
//   2) Double Move - your next move covers 2x the dice value
//   3) Re-Roll     - discard your current roll and roll the dice again
// Each ability has a limited number of uses per player per game.
//
// EDITOR SETUP: hook each UI button to the matching on* method. The player then
// clicks one of their pieces (for Shield) the same way they move.

import { PlayerColor, GameEvent } from "./Types";
import GameManager from "./GameManager";
import Piece from "./Piece";
import AudioManager from "./AudioManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AbilitySystem extends cc.Component {

    @property({ type: GameManager })
    game: GameManager = null;

    @property({ tooltip: "Uses of each ability per player per game" })
    usesPerAbility: number = 2;

    @property({ type: cc.Label, tooltip: "Label on the Double button (shows remaining uses)" })
    doubleLabel: cc.Label = null;

    @property({ type: cc.Label, tooltip: "Label on the Shield button (shows remaining uses)" })
    shieldLabel: cc.Label = null;

    @property({ type: cc.Label, tooltip: "Label on the Re-Roll button (shows remaining uses)" })
    rerollLabel: cc.Label = null;

    // remaining[color][abilityId] = count
    private _remaining: { [color: number]: { [id: string]: number } } = {};
    private _awaitingTarget: string = null; // "shield" | "recall" | null

    start() {
        for (let c = 0; c < 4; c++) {
            this._remaining[c] = { shield: this.usesPerAbility, double: this.usesPerAbility, reroll: this.usesPerAbility };
        }

        // Update labels whenever the turn changes or an ability is used
        this.game.events.on(GameEvent.TURN_CHANGED, () => this._updateLabels(), this);
        this.game.events.on(GameEvent.ABILITY_USED, () => this._updateLabels(), this);
        this._updateLabels();
    }

    private _updateLabels() {
        const color = this.game.currentColor;
        if (this.doubleLabel) this.doubleLabel.string = `Double (${this.getRemaining(color, "double")})`;
        if (this.shieldLabel) this.shieldLabel.string = `Shield (${this.getRemaining(color, "shield")})`;
        if (this.rerollLabel) this.rerollLabel.string = `Re-Roll (${this.getRemaining(color, "reroll")})`;
    }

    private _canUse(id: string): boolean {
        const color = this.game.currentColor;
        return this._remaining[color][id] > 0;
    }

    private _consume(id: string) {
        const color = this.game.currentColor;
        this._remaining[color][id] -= 1;
        this.game.events.emit(GameEvent.ABILITY_USED, id);
        if (AudioManager.instance) AudioManager.instance.playSfx("ability");
    }

    // ---- 1) Double Move: no target, affects the move you're about to make ----
    public onDoubleMovePressed() {
        if (!this._canUse("double")) return;
        // Only meaningful after a roll, before you pick a piece.
        if (this.game.currentRoll <= 0) return;
        this.game.pendingDoubleMove = true;
        this._consume("double");
    }

    // ---- 2) Shield: arm, then player clicks one of their pieces ----
    public onShieldPressed() {
        if (!this._canUse("shield")) return;
        this._awaitingTarget = "shield";
        this._highlightOwnPieces(true);
    }

    // ---- 3) Re-Roll: discard current roll and roll again ----
    public onRerollPressed() {
        if (!this._canUse("reroll")) return;
        this._consume("reroll");
        this.game.forceReroll();
    }

    private _highlightOwnPieces(on: boolean) {
        const pieces = this.game.getPieces(this.game.currentColor);
        for (const p of pieces) {
            // Re-route clicks to the ability while a target is awaited.
            if (on) {
                p.setHighlight(!p.isFinished());
                p.onClicked = (piece) => this._onAbilityTarget(piece);
            } else {
                p.setHighlight(false);
                p.onClicked = (piece) => this.game.onPieceClicked(piece);
            }
        }
    }

    private _onAbilityTarget(piece: Piece) {
        if (this._awaitingTarget === "shield") {
            piece.setShield(true);
            this._consume("shield");
        }
        this._awaitingTarget = null;
        this._highlightOwnPieces(false); // restores normal click routing
    }

    public getRemaining(color: PlayerColor, id: string): number {
        return this._remaining[color] ? this._remaining[color][id] : 0;
    }
}
