import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Fallback rates if admin_settings not available
const DEFAULT_RATES: Record<string, number> = {
  PRE: 0.008,
  BRONZ: 0.01,
  SILVER: 0.02,
  SILVER_ELITE: 0.03,
  GOLD: 0.04,
  ZAFFIRO: 0.05,
  DIAMANTE: 0.05,
};

const LEVEL_REQUIREMENTS: { level: string; direct: number; total: number }[] = [
  { level: 'DIAMANTE', direct: 6, total: 46656 },
  { level: 'GOLD', direct: 6, total: 1296 },
  { level: 'SILVER_ELITE', direct: 6, total: 216 },
  { level: 'SILVER', direct: 6, total: 36 },
  { level: 'BRONZ', direct: 6, total: 6 },
];

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Load dynamic rates from admin_settings
    let rates = { ...DEFAULT_RATES };
    const { data: levelSetting } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "level_config")
      .single();

    if (levelSetting?.value) {
      try {
        const config = JSON.parse(levelSetting.value) as { name: string; rate: number; active: boolean }[];
        for (const l of config) {
          if (l.active) {
            rates[l.name] = l.rate / 100; // Convert percentage to decimal
          }
        }
      } catch {}
    }

    // 1. Calculate daily returns ONLY for investments where >=24h passed since last payout
    // Each user has their own 24h cycle starting from their investment timestamp
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: investments, error: invErr } = await supabase
      .from("investments")
      .select("id, user_id, amount, plan_name, last_payout_at, created_at")
      .eq("status", "active")
      .or(`last_payout_at.lte.${cutoff},last_payout_at.is.null`);

    if (invErr) throw invErr;

    let processed = 0;
    let skipped = 0;
    const now = new Date().toISOString();

    for (const inv of investments || []) {
      // Double-check: if last_payout_at is null, use created_at as the reference
      const lastPayout = inv.last_payout_at || inv.created_at;
      const hoursSince = (Date.now() - new Date(lastPayout).getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        skipped++;
        continue;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("level")
        .eq("user_id", inv.user_id)
        .single();

      const level = profile?.level || "PRE";
      const rate = rates[level] || 0.008;
      const dailyReturn = Number(inv.amount) * rate;

      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("balance, total_earned")
        .eq("user_id", inv.user_id)
        .single();

      if (currentProfile) {
        await supabase
          .from("profiles")
          .update({
            balance: Number(currentProfile.balance) + dailyReturn,
            total_earned: Number(currentProfile.total_earned) + dailyReturn,
          })
          .eq("user_id", inv.user_id);
      }

      const { data: currentInv } = await supabase
        .from("investments")
        .select("earned, days_remaining")
        .eq("id", inv.id)
        .single();

      if (currentInv) {
        const newDays = currentInv.days_remaining - 1;
        await supabase
          .from("investments")
          .update({
            earned: Number(currentInv.earned) + dailyReturn,
            days_remaining: newDays,
            status: newDays <= 0 ? "completed" : "active",
            last_payout_at: now,
          })
          .eq("id", inv.id);
      }

      await supabase.from("income_records").insert({
        user_id: inv.user_id,
        amount: dailyReturn,
        type: "interest",
      });

      processed++;
    }

    // 2. Check qualification upgrades
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("user_id, level, direct_referrals, total_network");

    let upgrades = 0;

    for (const p of allProfiles || []) {
      let newLevel = p.level;
      for (const req of LEVEL_REQUIREMENTS) {
        if (p.direct_referrals >= req.direct && p.total_network >= req.total) {
          newLevel = req.level;
          break;
        }
      }
      if (newLevel !== p.level) {
        await supabase
          .from("profiles")
          .update({ level: newLevel })
          .eq("user_id", p.user_id);
        upgrades++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed_investments: processed,
        skipped_investments: skipped,
        level_upgrades: upgrades,
        timestamp: new Date().toISOString(),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
