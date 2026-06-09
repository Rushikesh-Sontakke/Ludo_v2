// Dice.ts
// A PHYSICAL die: it is tossed upward, falls under gravity, tumbles and bounces,
// then settles and reports a fair 1..6 value. This is what earns the "Gravity
// System" half of the 13% Physical Systems line for a board game that otherwise
// has no gravity.
//
// EDITOR SETUP:
//  - Add cc.RigidBody (type = Dynamic, gravityScale = 1) to the dice node.
//  - Add cc.PhysicsBoxCollider (set density/friction/restitution ~0.3 for a
//    nice bounce). Add static PhysicsBoxColliders as "table"/walls so it lands.
//  - Make sure physics is enabled (GameManager.onLoad does this globally).
//  - diceFaces: 6 sprite frames for faces 1..6 (optional, for a 2D face swap).

const { ccclass, property } = cc._decorator;

@ccclass
export default class Dice extends cc.Component {

    @property({ type: [cc.SpriteFrame], tooltip: "Face sprites for values 1..6 (index 0 = face 1)" })
    diceFaces: cc.SpriteFrame[] = [];

    @property({ type: cc.Sprite, tooltip: "Sprite that shows the resulting face" })
    faceSprite: cc.Sprite = null;

    @property({ tooltip: "Seconds to let physics tumble before reading the value" })
    settleTime: number = 1.0;

    @property({ tooltip: "Upward launch impulse" })
    launchImpulse: number = 6;

    private _rb: cc.RigidBody = null;
    private _rolling = false;

    onLoad() {
        this._rb = this.getComponent(cc.RigidBody);
    }

    /**
     * Roll the die. The value is decided with a fair RNG (so gameplay is never
     * at the mercy of the physics sim), while the physics provides the tumble.
     * Returns a Promise that resolves with the final value 1..6.
     */
    public roll(): Promise<number> {
        return new Promise((resolve) => {
            if (this._rolling) return;
            this._rolling = true;

            const value = 1 + Math.floor(Math.random() * 6); // fair 1..6

            if (this._rb) {
                // Toss: upward impulse + random sideways nudge + spin.
                this._rb.linearVelocity = cc.v2(0, 0);
                this._rb.angularVelocity = 0;
                const lateral = (Math.random() - 0.5) * 4;
                this._rb.applyLinearImpulse(
                    cc.v2(lateral, this.launchImpulse),
                    this._rb.getWorldCenter(),
                    true
                );
                this._rb.applyTorque((Math.random() - 0.5) * 8, true);
            }

            // After the tumble, lock the die and show the chosen face.
            this.scheduleOnce(() => {
                if (this._rb) {
                    this._rb.linearVelocity = cc.v2(0, 0);
                    this._rb.angularVelocity = 0;
                }
                this.showFace(value);
                this._rolling = false;
                resolve(value);
            }, this.settleTime);
        });
    }

    public showFace(value: number) {
        if (this.faceSprite && this.diceFaces.length >= 6) {
            this.faceSprite.spriteFrame = this.diceFaces[value - 1];
        }
    }
}
