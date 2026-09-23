import { createClient } from "npm:@supabase/supabase-js@2.45.0";

/**
 * Daily-returns v3
 * Tutta la logica critica è ora atomica dentro la RPC process_daily_returns()
 * (FOR UPDATE su investimento + profilo, guardia anti doppio pagamento, ledger).
 * Questa edge function è solo il trigger schedulabile.
 */
async function isAuthorized(req: Request): Promise<boolean> {
  // 1) Scheduled invocation with the shared cron secret (fail closed if unset)
  const cronSecret = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (cronSecret && provided && provided === cronSecret) return true;

  // 2) Manual invocation by an authenticated admin user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.replace("Bearer ", "");

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (token === serviceKey) return true;

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
  const { data: userData, error } = await admin.auth.getUser(token);
  if (error || !userData?.user) return false;
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin");
  return !!roles && roles.length > 0;
}

Deno.serve(async (req) => {
  if (!(await isAuthorized(req))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.rpc("process_daily_returns");
    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    return new Response(JSON.stringify({
      success: true,
      processed_investments: row?.processed ?? 0,
      completed_investments: row?.completed ?? 0,
      skipped_investments: row?.skipped ?? 0,
      timestamp: new Date().toISOString(),
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
