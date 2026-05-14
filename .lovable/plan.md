
# Reset app utente in stile USDT (gold/dark)

## Cosa NON tocco
- `src/pages/AdminPage.tsx` + `src/components/admin/*` (CompensationTab, IntegrationsTab, WatcherTab)
- Edge functions: `daily-returns`, `deposit-watcher`, `test-integration`
- Tabelle DB e RPC esistenti (`create_investment`, `process_matched_deposit`, `award_level_bonus`, `recompute_user_metrics`, ecc.)
- `AuthContext`, `ProtectedRoute`, hooks dati (`useProfile`, `useLevels`, `useReferralTree`, `useCompensationConfig`)
- Watcher TronGrid/Infura, deposit intents, wallet_transactions ledger
- Tutte le API keys / secrets già configurate

## Cosa rifaccio da zero
- Brand: "WAY ONE" → **USDT** (header, footer, logo monogramma "U" cerchiato gold)
- Tema: rimuovo `pirate-theme` e classi `pirate-*` lato utente; nuovo design system **USDT Gold** (navy `#0B1426`, gold `#D4AF37`, cream)
- Pagine utente ricostruite con look LYRA del mockup:
  - **Landing (`/`)** — Hero con monogramma U, CTA Registrati/Accedi, sezione "Interfaccia app", flusso 5 step (Registrati→Deposita→Monitora→Condividi→Preleva), caratteristiche UX
  - **Home/Dashboard (`/home`)** — Card saldo grande con monogramma, 4 quick actions (Investi, Referral, Statistiche, Notifiche), Panoramica (rendimento giornaliero, piano attivo, scadenza)
  - **Investi (`/invest`)** — Lista piani durata (Silver 30gg / Gold 60gg / Platinum 90gg / Diamond 120gg) con icone diamante, tasso giornaliero, bottone Conferma
  - **Wallet (`/fund` + `/deposit` + `/withdraw`)** — Saldo + Deposita/Preleva + cronologia movimenti colorata (+verde / -rosso)
  - **Referral/Network (`/network`)** — Codice referral copiabile, link condivisibile, share buttons (WhatsApp/Telegram/Email), statistiche referral
  - **Statistiche/Income (`/income`)** — Grafico rendimenti, deposito totali, referral attivi, piani attivi
  - **Profilo (`/profile`)** — minimal, livello attuale, logout
  - **Login/Signup (`/login`)** — form dorato su navy
- `AppLayout`: header `USDT` + monogramma, bottom nav 5 voci con stile gold (Home, Wallet, Investi, Referral, Profilo)

## Piani investimento (sostituiscono ranghi pirata in UI)
Solo presentazione UI. La tabella DB `levels` resta com'è (gamma/beta/bronze/silver/gold/diamante) per non rompere RPC `create_investment` e bonus rete. Etichette mostrate come Silver/Gold/Platinum/Diamond con durata.

> Nota importante: l'RPC `create_investment` accetta solo durate **45 o 90 giorni**. Per supportare 30/60/90/120 dovrei modificare la funzione DB. **Domanda separata:** vuoi che aggiorni l'RPC alle nuove durate (30/60/90/120) o teniamo 45/90 solo cambiando le label?

## Design system USDT
```
--u-bg:        220 50% 6%      /* navy profondo */
--u-surface:   220 40% 9%
--u-card:      220 35% 12%
--u-gold:      43 74% 52%      /* #D4AF37 */
--u-gold-soft: 43 60% 65%
--u-cream:     45 30% 92%
--u-muted:     220 15% 60%
--u-success:   142 70% 45%
--u-danger:    0 70% 55%
font: Inter + display Playfair (per "USDT" e numeri grandi)
```

## Tecnico
- Nuovo file `src/index.css` (mantengo solo Tailwind base + nuovo set di token `--u-*`, rimuovo `--p-*` e classi `pirate-*`)
- Riscrivo: `Index.tsx`, `HomePage.tsx`, `InvestPage.tsx`, `FundPage.tsx`, `DepositPage.tsx`, `WithdrawPage.tsx`, `NetworkPage.tsx`, `IncomePage.tsx`, `ProfilePage.tsx`, `LoginPage.tsx`, `QualifichePage.tsx`, `AppLayout.tsx`
- `AdminPage.tsx` resta col suo stile (non lo cambio)
- Genero 1 immagine hero "Interfaccia app USDT" stile mockup
- Nessuna migrazione DB salvo conferma su durate piani

## Conferma necessaria
1. OK al piano? 
2. Aggiorno RPC `create_investment` per durate 30/60/90/120 oppure tengo 45/90 con sole label nuove?
