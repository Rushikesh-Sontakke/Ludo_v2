// FirebaseManager.ts
// Covers three rubric lines:
//   - Account system: sign up / log in / log out (3%) + Rankings (4%)
//   - Archive/Reading Mechanism via Firebase (6%): per-account save slot
//
// This uses the Firebase Web SDK v8 "compat" global (`firebase.*`), which is the
// easiest to drop into a Cocos 2.4 web build. See README for how to load the SDK
// in your build template's index.html. All methods return Promises.

declare const firebase: any; // provided by the Firebase SDK loaded in index.html

const { ccclass, property } = cc._decorator;

// Paste YOUR project's config here (Firebase console -> Project settings -> Web app).
const FIREBASE_CONFIG = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
};

@ccclass
export default class FirebaseManager extends cc.Component {

    public static instance: FirebaseManager = null;
    private _auth: any = null;
    private _db: any = null;

    onLoad() {
        if (FirebaseManager.instance) { this.node.destroy(); return; }
        FirebaseManager.instance = this;
        cc.game.addPersistRootNode(this.node);

        if (typeof firebase === "undefined") {
            cc.error("[Firebase] SDK not loaded. Add the <script> tags to index.html (see README).");
            return;
        }
        if (!firebase.apps || !firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        this._auth = firebase.auth();
        this._db = firebase.database();
    }

    get uid(): string | null {
        return this._auth && this._auth.currentUser ? this._auth.currentUser.uid : null;
    }

    // ---------------------------------------------------------- account system
    public signUp(email: string, password: string, displayName: string): Promise<any> {
        return this._auth.createUserWithEmailAndPassword(email, password)
            .then((cred: any) => {
                // Seed a profile + empty archive for this account.
                return this._db.ref(`users/${cred.user.uid}`).set({
                    name: displayName || email.split("@")[0],
                    createdAt: Date.now(),
                    archive: { volume: 0.6, lastResult: "", wins: 0 },
                }).then(() => cred);
            });
    }

    public signIn(email: string, password: string): Promise<any> {
        return this._auth.signInWithEmailAndPassword(email, password);
    }

    public signOut(): Promise<void> {
        return this._auth.signOut();
    }

    public onAuthChanged(cb: (user: any) => void) {
        if (this._auth) this._auth.onAuthStateChanged(cb);
    }

    // ----------------------------------------------- archive (read/write slot)
    /** Overwrite (or merge) this account's fixed archive field. */
    public saveArchive(data: object): Promise<void> {
        if (!this.uid) return Promise.reject("not signed in");
        return this._db.ref(`users/${this.uid}/archive`).update(data);
    }

    public loadArchive(): Promise<any> {
        if (!this.uid) return Promise.reject("not signed in");
        return this._db.ref(`users/${this.uid}/archive`).once("value")
            .then((snap: any) => snap.val());
    }

    // ----------------------------------------------------------------- rankings
    /** Record a finished game's result for the leaderboard. */
    public submitScore(name: string, score: number): Promise<void> {
        return this._db.ref("rankings").push({
            name, score, at: Date.now(),
        }).then(() => {
            // Also bump the player's win count in their archive.
            if (this.uid) {
                const ref = this._db.ref(`users/${this.uid}/archive/wins`);
                return ref.transaction((w: number) => (w || 0) + 1);
            }
        });
    }

    /** Top N scores, highest first. */
    public getRankings(limit = 10): Promise<{ name: string; score: number }[]> {
        return this._db.ref("rankings")
            .orderByChild("score").limitToLast(limit).once("value")
            .then((snap: any) => {
                const rows: { name: string; score: number }[] = [];
                snap.forEach((child: any) => {
                    const v = child.val();
                    rows.push({ name: v.name, score: v.score });
                });
                return rows.reverse(); // highest first
            });
    }
}
