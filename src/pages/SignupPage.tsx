// Sign-up and sign-in share one passwordless email + one-time code flow:
// verifying the code creates the account if the email is new, otherwise signs
// in. So /signup renders the exact same screen as /login.
export { LoginPage as SignupPage } from "./LoginPage";
