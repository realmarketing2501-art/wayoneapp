## Obiettivi

1. **Guest mode**: chiunque può esplorare l'app senza login (Home, Investi, Network, Statistiche, Profilo in sola lettura con dati demo).
2. **Login Google** + email/password attuale.
3. **Anti-doppio account**: tracciare IP, fingerprint device (OS, browser, schermo, lingua, timezone, hash hardware), wallet, account Google.
4. **Report admin**: nuova tab "Registrazioni & Anomalie" con lista signup + flag duplicati sospetti.

---

## 1. Backend (DB + Edge Function)

### Migrazione DB
- Tabella `signup_events`: `user_id`, `email`, `provider` (email/google), `google_sub`, `ip`, `user_agent`, `os`, `device_type`, `screen`, `timezone`, `language`, `fingerprint_hash`, `created_at`. RLS: solo admin SELECT.
- Tabella `account_anomalies`: `user_id`, `type` (`duplicate_ip` | `duplicate_fingerprint` | `duplicate_google_sub` | `duplicate_wallet`), `match_user_id`, `severity`, `details` jsonb, `resolved`, `created_at`. RLS: solo admin.
- RPC `record_signup_event(p_payload jsonb)`: scrive evento, scansiona match (ip / fingerprint_hash / google_sub negli ultimi 90gg, wallet su `wallets`), inserisce righe in `account_anomalies` per ogni match.

### Edge function `track-signup`
- POST chiamato dal client subito dopo `signUp`/OAuth callback.
- Estrae IP da headers (`x-forwarded-for`), prende `user_agent`, payload fingerprint dal body, chiama RPC `record_signup_event`.
- Stesso endpoint usato anche al login per aggiornare `last_seen_ip` / fingerprint senza creare doppi.

### Auth
- Abilitare Google via `configure_social_auth(["google"])`. Email/password resta attivo.

---

## 2. Frontend

### Guest mode
- Nuovo hook `useGuestMode()`: se `!user`, attiva flag `isGuest=true` e fornisce dati demo (saldo 1.250 USDT, 1 piano Gold attivo, 4 referral fittizi).
- `ProtectedRoute` modificato: invece di redirect, lascia entrare guest e passa flag.
- Pagine `HomePage`, `InvestPage`, `NetworkPage`, `IncomePage`, `ProfilePage`: se `isGuest`, mostrano dati demo + banner "Stai esplorando in modalità ospite — registrati per attivare le funzioni reali".
- Pagine `DepositPage`, `WithdrawPage`, action "Investi/Conferma": bloccate per guest con modal "Registrati per continuare" → CTA Google + email.
- Header AppLayout: se guest, bottone "Accedi/Registrati" al posto di avatar.

### Login Google
- `LoginPage`: bottone "Continua con Google" sopra il form email. Usa `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`.
- Dopo signIn, hook `useTrackSignup` calcola fingerprint client-side (`navigator.userAgent`, `screen.width/height`, `navigator.language`, `Intl.DateTimeFormat().resolvedOptions().timeZone`, `navigator.hardwareConcurrency`, canvas/WebGL hash leggero) e invoca edge function `track-signup`.

### Admin
- Nuova tab in `AdminPage` → `RegistrationsTab.tsx`:
  - Tabella registrazioni recenti: data, email, provider, IP, OS/device, fingerprint short, badge anomalie.
  - Sezione "Anomalie attive": righe da `account_anomalies` non risolte, con link agli account coinvolti e bottone "Risolvi/Sospendi".

---

## 3. File coinvolti

**Nuovi**
- `supabase/functions/track-signup/index.ts`
- `src/hooks/useGuestMode.ts`
- `src/hooks/useTrackSignup.ts`
- `src/lib/fingerprint.ts`
- `src/components/admin/RegistrationsTab.tsx`
- `src/components/GuestGate.tsx` (modal/banner)

**Modificati**
- `src/components/ProtectedRoute.tsx` (lascia passare guest)
- `src/contexts/AuthContext.tsx` (espone `isGuest`)
- `src/pages/LoginPage.tsx` (bottone Google + tracking)
- `src/pages/HomePage.tsx`, `InvestPage.tsx`, `NetworkPage.tsx`, `IncomePage.tsx`, `ProfilePage.tsx` (dati demo se guest)
- `src/pages/DepositPage.tsx`, `WithdrawPage.tsx` (gate guest)
- `src/components/AppLayout.tsx` (CTA registrati)
- `src/pages/AdminPage.tsx` (nuova tab)

---

## Note
- Il fingerprint è euristico (privacy-friendly, no librerie esterne pesanti). I match servono come segnale: l'admin decide se sospendere.
- Wallet duplicato già controllato lato `wallets` table — basta aggiungere check al momento di salvare un wallet e creare anomalia.
- Tutte le tabelle nuove con RLS solo admin (`has_role(auth.uid(), 'admin')`).

Confermi e procedo?