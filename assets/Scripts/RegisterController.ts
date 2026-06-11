import FirebaseManager from "./FirebaseManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class RegisterController extends cc.Component {

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

        fm.signUp(email, password)
            .then(() => {
                this.showMessage("Account created! Redirecting to login...");
                this.scheduleOnce(() => cc.director.loadScene("LoginScene"), 1.5);
            })
            .catch((err: any) => this.showMessage(this.errorMessage(err.code)));
    }

    private showMessage(msg: string): void {
        if (this.messageLabel) this.messageLabel.string = msg;
    }

    private errorMessage(code: string): string {
        switch (code) {
            case "auth/email-already-in-use":   return "An account with this email already exists.";
            case "auth/invalid-email":          return "Invalid email address.";
            case "auth/weak-password":          return "Password must be at least 6 characters.";
            case "auth/network-request-failed": return "Network error. Check your connection.";
            default:                            return "Registration failed. Please try again.";
        }
    }
}
