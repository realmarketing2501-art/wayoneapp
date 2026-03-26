import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DAILY_RATES: Record<string, number> = {
  PRE: 0.008,
  BRONZ: 0.01,
  SILVER: 0.02,
  SILVER_ELITE: 0.03,
  GOLD: 0.04,
  ZAFFIRO: 0.05,
  DIAMANTE: 0.06,
};

const NETWORK_BONUS: Record<string, number> = {
  BRONZ: 0.10,
  SILVER: 0.15,
  SILVER_ELITE: 0.20,
  GOLD: 0.20,
  ZAFFIRO: 0.25,
  DIAMANTE: 0.30,
};

const LEVEL_REQUIREMENTS: { level: string; direct: number; total: number }[] = [
  { level: 'DIAMANTE', direct: 6, total: 46656 },
  { level: 'ZAFFIRO', direct: 6, total: 7776 },
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

    // 1. Calculate daily returns for active investments
    const { data: investments, error: invErr } = await supabase
      .from("investments")
      .select("id, user_id, amount, plan_name")
      .eq("status", "active");

    if (invErr) throw invErr;

    let processed = 0;

    for (const inv of investments || []) {
      // Get user level
      const { data: profile } = await supabase
        .from("profiles")
        .select("level")
        .eq("user_id", inv.user_id)
        .single();

      const level = profile?.level || "PRE";
      const rate = DAILY_RATES[level] || 0.008;
      const dailyReturn = Number(inv.amount) * rate;

      // Update user balance
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

      // Update investment earned
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
          })
          .eq("id", inv.id);
      }

      // Log income
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
