
import {UI, Card} from "@/app/styles/userinterfacestyle";
import {Button} from "@/app/styles/buttonstyle";
import {Input} from "@/app/styles/inputStyle";

export const LandingPage = ({ 
    email,
    setEmail,
    signIn, 
    status,
}: {  
    email: string;
    setEmail: (v: string) => void;
    signIn: () => void;
    status?: string;
}
  ) => (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
            <Card style={{ maxWidth: 560, width: "100%", padding: 26, boxShadow: UI.shadow }}>
            <h1 style={{ margin: 0, fontSize: 46, fontWeight: 850, letterSpacing: -0.8, lineHeight: "1.05" }}>
                  Word Bank
            </h1>
                <p style={{ marginTop: 10, color: UI.muted, lineHeight: "22px" }}>
                  A little place to collect words ツ. Log in once and your bank syncs across laptop + phone.
                </p>
    
                <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{ flex: 1, minWidth: 240 }}
                  />
                  <Button onClick={signIn} disabled={!email.trim()} variant="primary">
                    Send link
                  </Button>
                </div>
    
                {status ? (
                  <div style={{ marginTop: 14, color: UI.muted, fontSize: 13, lineHeight: "18px" }}>{status}</div>
                ) : null}
              </Card>
            </div>
  );