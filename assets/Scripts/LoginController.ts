import FirebaseManager from "./FirebaseManager";
import SaveBridge from "./SaveBridge";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LoginController extends cc.Component {

    // ---- login form ----
    @property(cc.EditBox)
    emailEditBox: cc.EditBox = null as any;

    @property(cc.EditBox)
    passwordEditBox: cc.EditBox = null as any;

    @property(cc.Label)
    messageLabel: cc.Label = null as any;

    // ---- panels ----
    @property(cc.Node)
    loginPanel: cc.Node = null as any;

    @property(cc.Node)
    saveCheckPanel: cc.Node = null as any;

    // ---- save check buttons (inside saveCheckPanel) ----
    @property(cc.Node)
    loadSaveBtn: cc.Node = null as any;

    @property(cc.Node)
    newGameBtn: cc.Node = null as any;

    onLoad() {
        if (this.saveCheckPanel) this.saveCheckPanel.active = false;
    }

    // ----------------------------------------------------------------- login
    onEnterClick(): void {
        const fm = FirebaseManager.instance;
        if (!fm) { this.showMessage("Firebase not ready. Please restart."); return; }

        const email = (this.emailEditBox?.string ?? "").trim();
        const password = this.passwordEditBox?.string ?? "";
        if (!email || !password) { this.showMessage("Please enter email and password."); return; }

        this.showMessage("Signing in…");
        fm.signIn(email, password)
            .then(() => this._checkSave())
            .catch((err: any) => this.showMessage(this.errorMessage(err.code)));
    }

    onGoogleLoginClick(): void {
        const fm = FirebaseManager.instance;
        if (!fm) { this.showMessage("Firebase not ready. Please restart."); return; }

        fm.signInWithGoogle()
            .then(() => this._checkSave())
            .catch((err: any) => {
                if (err.code === "auth/popup-closed-by-user" ||
                    err.code === "auth/cancelled-popup-request") return;
                this.showMessage(this.errorMessage(err.code));
            });
    }

    // ---------------------------------------------------------- save check
    private async _checkSave(): Promise<void> {
        this.showMessage("Checking save data…");
        console.log("[CheckSave] Starting check...");
        let save: any = null;
        const fm = FirebaseManager.instance;
        try {
            if (fm) save = await fm.loadSave();
        } catch (e) {
            console.error("[CheckSave] loadSave FAILED:", e);
        }
        console.log("[CheckSave] Result:", save !== null ? "SAVE EXISTS ✓" : "NO SAVE");

        SaveBridge.pendingSave = save;

        // Swap panels
        if (this.loginPanel) this.loginPanel.active = false;
        if (this.saveCheckPanel) this.saveCheckPanel.active = true;

        // Always show both buttons. Disable Load Save when no save exists.
        if (this.loadSaveBtn) {
            this.loadSaveBtn.active = true;
            const btn = this.loadSaveBtn.getComponent(cc.Button);
            if (btn) btn.interactable = (save !== null);
        }
        if (this.newGameBtn) {
            this.newGameBtn.active = true;
        }
    }

    public onLoadSaveClick(): void {
        cc.director.loadScene("game");
    }

    public async onNewGameClick(): Promise<void> {
        SaveBridge.pendingSave = null;

        // Delete any existing cloud save so the old game can't resurrect later.
        const fm = FirebaseManager.instance;
        if (fm) {
            try { await fm.deleteSave(); }
            catch (e) { console.error("[NewGame] deleteSave failed:", e); }
        }

        cc.director.loadScene("game");
    }

    // ---------------------------------------------------------------- helpers
    private showMessage(msg: string): void {
        if (this.messageLabel) this.messageLabel.string = msg;
    }

    private errorMessage(code: string): string {
        switch (code) {
            case "auth/user-not-found":         return "No account found with this email.";
            case "auth/wrong-password":         return "Incorrect password.";
            case "auth/invalid-email":          return "Invalid email address.";
            case "auth/popup-blocked":          return "Popup blocked — allow popups for this site.";
            case "auth/network-request-failed": return "Network error. Check your connection.";
            default:                            return "Login failed. Please try again.";
        }
    }
}
