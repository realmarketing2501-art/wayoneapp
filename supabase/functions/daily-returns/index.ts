import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Daily-returns v2 (Way One Qualifiche)
 * - Usa investments.daily_rate snapshotato al momento della creazione (no più lookup runtime)
 * - Cicli per-investment: ogni investimento ha la propria finestra di 24h
 * - Sblocca balance_locked al completamento (status='completed')
 * - Accredita interessi su balance + balance_available (prelevabili)
 * - Scrive su wallet_transactions ledger
 */

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: investments, error: invErr } = await supabase
      .from("investments")
      .select("id, user_id, amount, plan_name, daily_rate, days_remaining, last_payout_at, created_at, earned")
      .eq("status", "active")
      .or(`last_payout_at.lte.${cutoff},last_payout_at.is.null`);

    if (invErr) throw invErr;

    let processed = 0;
    let skipped = 0;
    let completed = 0;
    const now = new Date().toISOString();

    for (const inv of investments ?? []) {
      const lastPayout = inv.last_payout_at ?? inv.created_at;
      const hoursSince = (Date.now() - new Date(lastPayout).getTime()) / 3_600_000;
      if (hoursSince < 24) { skipped++; continue; }

      const rate = Number(inv.daily_rate ?? 0);
      if (rate <= 0) { skipped++; continue; }

      const dailyEarn = Number(inv.amount) * (rate / 100);
      const newDays = inv.days_remaining - 1;
      const isCompleting = newDays <= 0;

      // Read current balance for ledger snapshot
      const { data: prof } = await supabase
        .from("profiles")
        .select("balance, balance_available, balance_locked, total_earned")
        .eq("user_id", inv.user_id)
        .single();

      if (!prof) { skipped++; continue; }

      const principalUnlock = isCompleting ? Number(inv.amount) : 0;
      const newBalance = Number(prof.balance) + dailyEarn;
      const newAvailable = Number(prof.balance_available) + dailyEarn + principalUnlock;
      const newLocked = Math.max(0, Number(prof.balance_locked) - principalUnlock);

      // Update profile (interest credit + optional principal unlock)
      await supabase.from("profiles").update({
        balance: newBalance,
        balance_available: newAvailable,
        balance_locked: newLocked,
        total_earned: Number(prof.total_earned) + dailyEarn,
        updated_at: now,
      }).eq("user_id", inv.user_id);

      // Update investment
      await supabase.from("investments").update({
        earned: Number(inv.earned) + dailyEarn,
        days_remaining: newDays,
        status: isCompleting ? "completed" : "active",
        last_payout_at: now,
      }).eq("id", inv.id);

      // Ledger: interest
      await supabase.from("wallet_transactions").insert({
        user_id: inv.user_id,
        type: "interest",
        direction: "in",
        amount: dailyEarn,
        asset: "USDT",
        status: "completed",
        description: `Interesse giornaliero ${inv.plan_name} - ${rate}%`,
        reference_id: inv.id,
        reference_type: "investment",
        balance_after: newBalance,
      });

      // Ledger: principal unlock on completion
      if (isCompleting && principalUnlock > 0) {
        await supabase.from("wallet_transactions").insert({
          user_id: inv.user_id,
          type: "investment_unlock",
          direction: "in",
          amount: principalUnlock,
          asset: "USDT",
          status: "completed",
          description: `Sblocco capitale ${inv.plan_name}`,
          reference_id: inv.id,
          reference_type: "investment",
          balance_after: newBalance,
        });
        completed++;
      }

      // Income record (mantiene lo storico esistente)
      await supabase.from("income_records").insert({
        user_id: inv.user_id,
        amount: dailyEarn,
        type: "interest",
      });

      processed++;
    }

    return new Response(JSON.stringify({
      success: true,
      processed_investments: processed,
      skipped_investments: skipped,
      completed_investments: completed,
      timestamp: new Date().toISOString(),
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
