# WayOne

## ⚠️ AVVISO MIGRATION DISTRUTTIVA

La migration `supabase/migrations/20260420094826_*.sql` esegue un **WIPE completo**
dei dati utente non-admin (wallet_transactions, income_records, investments,
deposit_intents, deposits, withdrawals, fund_investments, user_tasks,
user_notifications, wallets, detected_transactions).

**Non re-applicare mai in produzione con utenti reali.**

È già stata applicata una sola volta nell'ambiente di sviluppo durante il setup
del modulo "Way One Qualifiche". In produzione le migration sono idempotenti per
ID, quindi non verrà re-eseguita automaticamente, ma se per qualunque motivo si
ripristina lo storico migrations (es. reset del progetto Supabase), questo file
deve essere **rimosso o neutralizzato** prima del deploy.

## Logica saldi e prelievi

Logica scelta: **A — saldo scalato alla richiesta, rimborso al rifiuto.**

- `create_withdrawal` (RPC): scala `balance` e `balance_available` dell'importo
  lordo + crea wallet_transaction in stato `pending`.
- `admin_approve_withdrawal` (RPC): cambia solo `status=completed`, salva
  `reviewed_by` e (opzionale) `tx_hash`. **Non tocca il saldo.**
- `admin_reject_withdrawal` (RPC): rimette l'importo lordo nel saldo, marca la
  transazione pending come `cancelled` e crea una transazione `withdrawal_refund`.

## Daily returns

Trigger schedulato: edge function `daily-returns` → chiama l'RPC atomica
`process_daily_returns()` che processa ogni investimento attivo con lock
`FOR UPDATE` su investimento e profilo, controllando `last_payout_at` per evitare
doppi pagamenti nello stesso ciclo di 24 h.
