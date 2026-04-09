import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// USDT contract addresses
const USDT_TRC20_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const USDT_ERC20_CONTRACT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const MIN_CONFIRMATIONS_TRC20 = 19;
const MIN_CONFIRMATIONS_ERC20 = 12;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const results = { trc20: null as any, erc20: null as any, expired: 0, matched: 0 };

  try {
    // Expire old intents first
    const { data: expiredCount } = await supabase.rpc("expire_old_deposit_intents");
    results.expired = expiredCount || 0;

    // Get active integrations config
    const { data: integrations } = await supabase
      .from("api_integrations")
      .select("service_key, config, is_active")
      .in("service_key", ["tron_trc20", "eth_erc20"]);

    const tronConfig = integrations?.find(i => i.service_key === "tron_trc20");
    const ethConfig = integrations?.find(i => i.service_key === "eth_erc20");

    // Run TRC-20 watcher
    if (tronConfig?.is_active) {
      try {
        results.trc20 = await watchTRC20(supabase, tronConfig.config as Record<string, string>);
      } catch (e) {
        results.trc20 = { error: (e as Error).message };
        await updateWatcherError(supabase, "TRC-20", (e as Error).message);
      }
    }

    // Run ERC-20 watcher
    if (ethConfig?.is_active) {
      try {
        results.erc20 = await watchERC20(supabase, ethConfig.config as Record<string, string>);
      } catch (e) {
        results.erc20 = { error: (e as Error).message };
        await updateWatcherError(supabase, "ERC-20", (e as Error).message);
      }
    }

    // Match detected transactions to intents
    results.matched = await matchAndCredit(supabase);

    return new Response(JSON.stringify({ success: true, ...results, timestamp: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function watchTRC20(supabase: any, config: Record<string, string>) {
  const { api_url, api_key, company_wallet } = config;
  if (!api_url || !api_key || !company_wallet) {
    throw new Error("TRC-20 config incomplete");
  }

  // Get last sync state
  const { data: state } = await supabase
    .from("watcher_state")
    .select("*")
    .eq("network", "TRC-20")
    .single();

  await supabase.from("watcher_state").update({ status: "syncing", last_sync_at: new Date().toISOString() }).eq("network", "TRC-20");

  // Query TRC20 USDT transfers TO company wallet
  const minTimestamp = state?.last_block_timestamp
    ? new Date(state.last_block_timestamp).getTime()
    : Date.now() - 3600000; // last hour if first run

  const url = `${api_url.replace(/\/$/, "")}/v1/accounts/${company_wallet}/transactions/trc20?only_to=true&limit=50&min_timestamp=${minTimestamp}&contract_address=${USDT_TRC20_CONTRACT}`;

  const res = await fetch(url, {
    headers: { "TRON-PRO-API-KEY": api_key },
  });

  if (!res.ok) {
    throw new Error(`TronGrid responded ${res.status}`);
  }

  const body = await res.json();
  const txs = body.data || [];
  let detected = 0;
  let latestTimestamp = state?.last_block_timestamp;
  let latestBlock = state?.last_block_number || 0;

  for (const tx of txs) {
    const amount = parseInt(tx.value || "0") / 1e6; // USDT has 6 decimals on TRC20
    const txHash = tx.transaction_id;
    const toAddr = tx.to;
    const fromAddr = tx.from;
    const blockNum = tx.block_timestamp ? Math.floor(tx.block_timestamp / 1000) : 0;
    const blockTs = tx.block_timestamp ? new Date(tx.block_timestamp).toISOString() : null;

    if (amount <= 0) continue;

    // Insert if not duplicate (upsert-like with ON CONFLICT)
    const { error } = await supabase.from("detected_transactions").upsert({
      tx_hash: txHash,
      network: "TRC-20",
      from_address: fromAddr,
      to_address: toAddr,
      amount,
      token: "USDT",
      confirmations: MIN_CONFIRMATIONS_TRC20, // TronGrid returns confirmed txs
      block_number: blockNum,
      block_timestamp: blockTs,
      status: "detected",
    }, { onConflict: "tx_hash,network", ignoreDuplicates: true });

    if (!error) detected++;

    if (tx.block_timestamp && (!latestTimestamp || new Date(tx.block_timestamp) > new Date(latestTimestamp))) {
      latestTimestamp = new Date(tx.block_timestamp).toISOString();
    }
    if (blockNum > latestBlock) latestBlock = blockNum;
  }

  // Update watcher state
  await supabase.from("watcher_state").update({
    status: "idle",
    last_sync_at: new Date().toISOString(),
    last_block_number: latestBlock || state?.last_block_number || 0,
    last_block_timestamp: latestTimestamp || state?.last_block_timestamp,
    total_detected: (state?.total_detected || 0) + detected,
  }).eq("network", "TRC-20");

  return { detected, txs_scanned: txs.length };
}

async function watchERC20(supabase: any, config: Record<string, string>) {
  const { infura_api_key, company_wallet, network: ethNetwork } = config;
  if (!infura_api_key || !company_wallet) {
    throw new Error("ERC-20 config incomplete");
  }

  const { data: state } = await supabase
    .from("watcher_state")
    .select("*")
    .eq("network", "ERC-20")
    .single();

  await supabase.from("watcher_state").update({ status: "syncing", last_sync_at: new Date().toISOString() }).eq("network", "ERC-20");

  const net = ethNetwork || "mainnet";
  const walletLower = company_wallet.toLowerCase();

  // Get latest block number
  const blockRes = await fetch(`https://${net}.infura.io/v3/${infura_api_key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
  });
  const blockData = await blockRes.json();
  if (blockData.error) throw new Error(`Infura: ${blockData.error.message}`);
  const latestBlock = parseInt(blockData.result, 16);

  // Scan from last known block (or last 100 blocks)
  const fromBlock = state?.last_block_number ? Number(state.last_block_number) + 1 : latestBlock - 100;

  // Use eth_getLogs to find USDT Transfer events TO company wallet
  // Transfer(address,address,uint256) topic
  const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
  const paddedWallet = "0x" + walletLower.slice(2).padStart(64, "0");

  const logsRes = await fetch(`https://${net}.infura.io/v3/${infura_api_key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getLogs",
      params: [{
        fromBlock: "0x" + fromBlock.toString(16),
        toBlock: "0x" + latestBlock.toString(16),
        address: USDT_ERC20_CONTRACT,
        topics: [transferTopic, null, paddedWallet],
      }],
      id: 1,
    }),
  });

  const logsData = await logsRes.json();
  if (logsData.error) throw new Error(`Infura logs: ${logsData.error.message}`);

  const logs = logsData.result || [];
  let detected = 0;

  for (const log of logs) {
    const txHash = log.transactionHash;
    const fromAddr = "0x" + log.topics[1].slice(26);
    const amount = parseInt(log.data, 16) / 1e6; // USDT has 6 decimals
    const blockNum = parseInt(log.blockNumber, 16);
    const confirmations = latestBlock - blockNum;

    if (amount <= 0) continue;

    const { error } = await supabase.from("detected_transactions").upsert({
      tx_hash: txHash,
      network: "ERC-20",
      from_address: fromAddr,
      to_address: walletLower,
      amount,
      token: "USDT",
      confirmations,
      block_number: blockNum,
      status: confirmations >= MIN_CONFIRMATIONS_ERC20 ? "detected" : "pending_confirmations",
    }, { onConflict: "tx_hash,network", ignoreDuplicates: true });

    if (!error) detected++;
  }

  await supabase.from("watcher_state").update({
    status: "idle",
    last_sync_at: new Date().toISOString(),
    last_block_number: latestBlock,
    total_detected: (state?.total_detected || 0) + detected,
  }).eq("network", "ERC-20");

  return { detected, logs_scanned: logs.length, latest_block: latestBlock };
}

async function matchAndCredit(supabase: any): Promise<number> {
  // Get unmatched detected transactions with enough confirmations
  const { data: unmatched } = await supabase
    .from("detected_transactions")
    .select("*")
    .eq("status", "detected")
    .is("matched_intent_id", null);

  if (!unmatched || unmatched.length === 0) return 0;

  let matched = 0;

  for (const tx of unmatched) {
    // Find matching pending intent: same network, same wallet, amount within tolerance (±0.99 USDT)
    const { data: intents } = await supabase
      .from("deposit_intents")
      .select("*")
      .eq("network", tx.network)
      .eq("status", "pending")
      .gte("amount_usdt", tx.amount - 0.99)
      .lte("amount_usdt", tx.amount + 0.99)
      .order("created_at", { ascending: true })
      .limit(5);

    if (!intents || intents.length === 0) {
      // No matching intent — mark for review
      await supabase.from("detected_transactions").update({
        status: "needs_review",
        processing_error: "Nessun deposit intent corrispondente trovato",
      }).eq("id", tx.id);
      continue;
    }

    // Find best match: exact amount match first, then closest
    let bestIntent = intents.find((i: any) => Math.abs(i.amount_usdt - tx.amount) < 0.01);
    if (!bestIntent) bestIntent = intents[0];

    // Process the match using the security definer function
    const { data: success, error } = await supabase.rpc("process_matched_deposit", {
      p_intent_id: bestIntent.id,
      p_tx_id: tx.id,
      p_amount: tx.amount,
      p_tx_hash: tx.tx_hash,
    });

    if (error) {
      await supabase.from("detected_transactions").update({
        status: "needs_review",
        processing_error: `Errore accredito: ${error.message}`,
      }).eq("id", tx.id);
    } else if (success) {
      matched++;
      // Update watcher stats
      await supabase.from("watcher_state").update({
        total_confirmed: supabase.rpc ? undefined : 0, // will use raw increment below
      }).eq("network", tx.network);

      // Increment counters
      const { data: ws } = await supabase.from("watcher_state").select("total_confirmed, total_credited").eq("network", tx.network).single();
      if (ws) {
        await supabase.from("watcher_state").update({
          total_confirmed: (ws.total_confirmed || 0) + 1,
          total_credited: (ws.total_credited || 0) + 1,
        }).eq("network", tx.network);
      }
    }
  }

  return matched;
}

async function updateWatcherError(supabase: any, network: string, error: string) {
  const { data: ws } = await supabase.from("watcher_state").select("total_errors").eq("network", network).single();
  await supabase.from("watcher_state").update({
    status: "error",
    last_error: error,
    last_error_at: new Date().toISOString(),
    total_errors: (ws?.total_errors || 0) + 1,
  }).eq("network", network);
}
