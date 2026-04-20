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
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = claims.claims.sub as string;

    // Check admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
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

async function testTron(config: Record<string, string>) {
  const { api_url, api_key, company_wallet } = config;
  if (!api_url || !api_key || !company_wallet) {
    return { success: false, message: "Campi obbligatori mancanti (URL, API Key, Wallet)" };
  }
  if (!company_wallet.startsWith("T") || company_wallet.length < 30) {
    return { success: false, message: "Indirizzo wallet TRON non valido (deve iniziare con T)" };
  }
  try {
    const url = `${api_url.replace(/\/$/, "")}/v1/accounts/${company_wallet}`;
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
  if (!company_wallet.startsWith("0x") || company_wallet.length !== 42) {
    return { success: false, message: "Indirizzo wallet Ethereum non valido (deve essere 0x + 40 hex)" };
  }
  try {
    const net = network || "mainnet";
    const res = await fetch(`https://${net}.infura.io/v3/${infura_api_key}`, {
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
