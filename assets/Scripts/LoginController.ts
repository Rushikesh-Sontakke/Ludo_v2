import FirebaseManager from "./FirebaseManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LoginController extends cc.Component {

    @property(cc.EditBox)
    emailEditBox: cc.EditBox = null as any;

    @property(cc.EditBox)
    passwordEditBox: cc.EditBox = null as any;

    @property(cc.Label)
    messageLabel: cc.Label = null as any;

    onEnterClick(): void {
        const fm = FirebaseManager.instance;
        if (!fm) { this.showMessage("Firebase not ready. Please restart."); return; }

        const email = (this.emailEditBox?.string ?? "").trim();
        const password = this.passwordEditBox?.string ?? "";
        if (!email || !password) { this.showMessage("Please enter email and password."); return; }

        fm.signIn(email, password)
            .then(() => cc.director.loadScene("game"))
            .catch((err: any) => this.showMessage(this.errorMessage(err.code)));
    }

    onGoogleLoginClick(): void {
        const fm = FirebaseManager.instance;
        if (!fm) { this.showMessage("Firebase not ready. Please restart."); return; }

        fm.signInWithGoogle()
            .then(() => cc.director.loadScene("game"))
            .catch((err: any) => {
                if (err.code === "auth/popup-closed-by-user" ||
                    err.code === "auth/cancelled-popup-request") return;
                this.showMessage(this.errorMessage(err.code));
            });
    }

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
