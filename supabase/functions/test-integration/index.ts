import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized", details: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // Check admin role using service role to bypass RLS
    const adminCheckClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: roles } = await adminCheckClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { service_key, config } = await req.json();

    let result: { success: boolean; message: string; details?: string };

    switch (service_key) {
      case "tron_trc20":
        result = await testTron(config);
        break;
      case "eth_erc20":
        result = await testEthereum(config);
        break;
      case "sendgrid":
        result = await testSendGrid(config);
        break;
      case "platform":
        result = { success: true, message: "Configurazione piattaforma valida" };
        break;
      default:
        result = { success: false, message: `Servizio sconosciuto: ${service_key}` };
    }

    // Update integration status using service role
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await adminClient.from("api_integrations").update({
      last_test_at: new Date().toISOString(),
      last_test_result: result.success ? "success" : "error",
      last_test_error: result.success ? null : result.message,
      status: result.success ? "active" : "error",
      updated_at: new Date().toISOString(),
    }).eq("service_key", service_key);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, message: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Only these Tron API hosts may be contacted by the server
const ALLOWED_TRON_HOSTS = new Set([
  "api.trongrid.io",
  "api.shasta.trongrid.io",
  "nile.trongrid.io",
  "api.nileex.io",
]);

async function testTron(config: Record<string, string>) {
  const { api_url, api_key, company_wallet } = config;
  if (!api_url || !api_key || !company_wallet) {
    return { success: false, message: "Campi obbligatori mancanti (URL, API Key, Wallet)" };
  }
  if (!/^T[1-9A-HJ-NP-Za-km-z]{25,40}$/.test(company_wallet)) {
    return { success: false, message: "Indirizzo wallet TRON non valido (deve iniziare con T)" };
  }
  let base: URL;
  try {
    base = new URL(api_url);
  } catch {
    return { success: false, message: "URL API non valido" };
  }
  if (base.protocol !== "https:" || !ALLOWED_TRON_HOSTS.has(base.hostname)) {
    return {
      success: false,
      message: `Host API non consentito. Host ammessi: ${[...ALLOWED_TRON_HOSTS].join(", ")}`,
    };
  }
  try {
    const url = `https://${base.hostname}/v1/accounts/${encodeURIComponent(company_wallet)}`;
    const res = await fetch(url, {
      headers: { "TRON-PRO-API-KEY": api_key },
    });
    if (!res.ok) {
      return { success: false, message: `TronGrid ha risposto con status ${res.status}` };
    }
    const data = await res.json();
    return {
      success: true,
      message: `Connessione riuscita. Account trovato.`,
      details: `Balance: ${(data.balance || 0) / 1e6} TRX`,
    };
  } catch (e) {
    return { success: false, message: `Errore di connessione: ${(e as Error).message}` };
  }
}

async function testEthereum(config: Record<string, string>) {
  const { infura_api_key, company_wallet, network } = config;
  if (!infura_api_key || !company_wallet) {
    return { success: false, message: "Campi obbligatori mancanti (Infura Key, Wallet)" };
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(company_wallet)) {
    return { success: false, message: "Indirizzo wallet Ethereum non valido (deve essere 0x + 40 hex)" };
  }
  const ALLOWED_ETH_NETWORKS = ["mainnet", "sepolia", "holesky"];
  const net = network || "mainnet";
  if (!ALLOWED_ETH_NETWORKS.includes(net)) {
    return { success: false, message: `Rete non consentita. Reti ammesse: ${ALLOWED_ETH_NETWORKS.join(", ")}` };
  }
  try {
    const res = await fetch(`https://${net}.infura.io/v3/${encodeURIComponent(infura_api_key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getBalance",
        params: [company_wallet, "latest"],
        id: 1,
      }),
    });
    if (!res.ok) {
      return { success: false, message: `Infura ha risposto con status ${res.status}` };
    }
    const data = await res.json();
    if (data.error) {
      return { success: false, message: `Errore Infura: ${data.error.message}` };
    }
    const balanceWei = parseInt(data.result, 16);
    const balanceEth = balanceWei / 1e18;
    return {
      success: true,
      message: "Connessione Infura riuscita.",
      details: `Balance: ${balanceEth.toFixed(6)} ETH`,
    };
  } catch (e) {
    return { success: false, message: `Errore di connessione: ${(e as Error).message}` };
  }
}

async function testSendGrid(config: Record<string, string>) {
  const { api_key, email_from } = config;
  if (!api_key) {
    return { success: false, message: "API Key SendGrid mancante" };
  }
  if (!email_from || !email_from.includes("@")) {
    return { success: false, message: "Email mittente non valida" };
  }
  try {
    const res = await fetch("https://api.sendgrid.com/v3/user/credits", {
      headers: { Authorization: `Bearer ${api_key}` },
    });
    if (res.status === 401 || res.status === 403) {
      return { success: false, message: "API Key SendGrid non valida o senza permessi" };
    }
    if (!res.ok) {
      return { success: false, message: `SendGrid ha risposto con status ${res.status}` };
    }
    return { success: true, message: "Connessione SendGrid verificata con successo." };
  } catch (e) {
    return { success: false, message: `Errore di connessione: ${(e as Error).message}` };
  }
}
