

# WAY ONE — Piano di Implementazione UI

## Design System
- **Tema dark fintech**: sfondo #0a0a0a, accento verde #00e676, oro #ffd700 per livelli premium
- **Mobile-first** con bottom navigation (Home / Invest / Rete / Income / Me)
- **Badge colorati** per ogni livello (Bronzo → Diamante)
- Font moderno, card con bordi sottili, stile crypto/fintech

## Pagine da costruire (tutte con dati mock)

### 1. Layout principale
- Bottom tab bar con 5 icone (Home, Invest, Network, Income, Profile)
- Header con logo WAY ONE e notifiche

### 2. 🏠 Home (Dashboard)
- Banner rotante con slogan
- 4 pulsanti rapidi (Deposit, Withdraw, Task Center, Invite)
- Card: saldo totale, rendimento giornaliero, livello attuale con badge, countdown prossimo accredito
- Sezione Academy (White Paper, Tutorial, FAQ)

### 3. 💼 Invest
- Card livello corrente con badge
- Lista piani (Conservative/Stable/Growth) con rendimento, durata, barra pool
- Tabella "I miei investimenti attivi"

### 4. 👥 Rete (MLM Tree)
- Albero interattivo espandibile fino a 6 livelli
- Statistiche rete (referral, volume, bonus)
- Link referral copiabile + QR code

### 5. 💰 Income
- Header reddito cumulativo
- Tab: Interest Income, Team Income, Bonus
- Grafico giornaliero (7/30/90 giorni)
- Tabella storico transazioni
- Pulsanti "Incassa"

### 6. 🏦 Fund
- Lista fondi speciali con badge, rendimento, barra progresso raccolta
- Tab: In corso, In arrivo, Esauriti, Terminati

### 7. 🔄 Withdraw
- Form prelievo con selezione tipo (Veloce/Medio/Lento) e calcolo fee
- Storico prelievi con stati

### 8. 👤 Profilo (Me)
- Avatar, username, livello, badge
- Security center, wallet collegati, lingua
- KYC placeholder

### 9. 📋 Task Center
- Lista missioni giornaliere/settimanali con reward USDT
- Barra progresso per ogni task

### 10. Pagine Auth
- Login e Registrazione con campo codice referral
- Stile dark coerente

*Nota: Admin panel e backend Supabase saranno fasi successive.*

