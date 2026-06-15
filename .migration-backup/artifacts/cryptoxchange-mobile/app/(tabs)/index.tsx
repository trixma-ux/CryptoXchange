import { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, ActivityIndicator, Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { walletsAPI, transactionsAPI, pricesAPI } from "@/lib/api";

const CRYPTO_COLORS: Record<string, string> = {
  BTC: "#f7931a", ETH: "#627eea", USDT_TRC20: "#26a17b", USDT_ERC20: "#26a17b",
  BNB: "#f3ba2f", SOL: "#9945ff", LTC: "#b9b9b9", XRP: "#00aae4", DOGE: "#c2a633",
};

function formatXOF(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M FCFA";
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}

function formatPriceFCFA(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);
  return n.toFixed(4);
}

const QUICK = [
  { label: "Acheter", icon: "shopping-cart" as const, color: "#10b981", route: "/(tabs)/trade" },
  { label: "Vendre", icon: "trending-down" as const, color: "#ef4444", route: "/(tabs)/trade" },
  { label: "Swap", icon: "repeat" as const, color: "#3b82f6", route: "/swap" },
  { label: "Dépôt", icon: "arrow-down-circle" as const, color: "#f59e0b", route: "/deposit" },
  { label: "Retrait", icon: "arrow-up-circle" as const, color: "#8b5cf6", route: "/withdraw" },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const priceInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    try {
      const [port, txs, px] = await Promise.allSettled([
        walletsAPI.getPortfolio(),
        transactionsAPI.getAll({ page: 1, limit: 5 }),
        pricesAPI.getPrices(),
      ]);
      if (port.status === "fulfilled") setPortfolio(port.value.data?.data);
      if (txs.status === "fulfilled") setTransactions(txs.value.data?.data?.transactions || []);
      if (px.status === "fulfilled") setPrices(px.value.data?.data || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    priceInterval.current = setInterval(() => {
      pricesAPI.getPrices().then(r => setPrices(r.data?.data || [])).catch(() => {});
    }, 30_000);
    return () => { if (priceInterval.current) clearInterval(priceInterval.current); };
  }, []);

  const topPrices = prices.filter(p => ["BTC", "ETH", "BNB", "SOL"].includes(p.currency));
  const s = styles(colors);
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Bonjour, {user?.firstName} 👋</Text>
          <View style={s.liveDot}>
            <View style={s.dot} />
            <Text style={s.liveText}>Prix en direct</Text>
          </View>
        </View>
        <Pressable onPress={() => router.push("/transactions")} style={s.iconBtn}>
          <Feather name="list" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, isWeb && { paddingBottom: 34 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        {/* Portfolio Balance */}
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>Valeur totale du portefeuille</Text>
          <View style={s.balanceRow}>
            <Text style={s.balanceValue}>
              {loading ? "—" : hideBalance ? "••••••• FCFA" : formatXOF(portfolio?.totalValueXOF || 0)}
            </Text>
            <Pressable onPress={() => setHideBalance(h => !h)} style={{ padding: 4 }}>
              <Feather name={hideBalance ? "eye" : "eye-off"} size={18} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>
          <Text style={s.balanceUSD}>
            {hideBalance ? "•••" : `≈ $${(portfolio?.totalValueUSD || 0).toFixed(2)}`}
          </Text>
          <View style={s.actions}>
            {QUICK.map(({ label, icon, color, route }) => (
              <Pressable key={label} onPress={() => router.push(route as any)} style={s.actionBtn}>
                <View style={[s.actionIcon, { backgroundColor: color + "33" }]}>
                  <Feather name={icon} size={18} color={color} />
                </View>
                <Text style={[s.actionLabel, { color }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Live Prices */}
        {topPrices.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Marchés</Text>
              <View style={s.liveChip}>
                <View style={s.dot} />
                <Text style={s.liveChipText}>Live · 30s</Text>
              </View>
            </View>
            <View style={s.priceGrid}>
              {topPrices.map((p: any) => {
                const positive = p.change24h >= 0;
                const color = CRYPTO_COLORS[p.currency] || "#6366f1";
                const sym = p.currency.replace("_TRC20", "").replace("_ERC20", "");
                return (
                  <Pressable key={p.currency} onPress={() => router.push("/(tabs)/trade")} style={s.priceCard}>
                    <View style={s.priceCardTop}>
                      <View style={[s.cryptoIcon, { backgroundColor: color + "22" }]}>
                        <Text style={[s.cryptoIconText, { color }]}>{sym[0]}</Text>
                      </View>
                      <Text style={[s.changeBadge, { color: positive ? "#10b981" : "#ef4444", backgroundColor: positive ? "#10b98122" : "#ef444422" }]}>
                        {positive ? "+" : ""}{p.change24h.toFixed(2)}%
                      </Text>
                    </View>
                    <Text style={s.priceCardSym}>{sym}</Text>
                    <Text style={s.priceCardVal}>{formatPriceFCFA(p.priceFCFA)}</Text>
                    <Text style={s.priceCardUnit}>FCFA</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Dernières transactions</Text>
            <Pressable onPress={() => router.push("/transactions")}>
              <Text style={s.seeAll}>Voir tout</Text>
            </Pressable>
          </View>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : transactions.length === 0 ? (
            <View style={s.empty}>
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
              <Text style={s.emptyText}>Aucune transaction</Text>
            </View>
          ) : (
            transactions.map((tx: any) => (
              <View key={tx.id} style={s.txRow}>
                <View style={[s.txIcon, { backgroundColor: tx.type === "DEPOSIT" ? "#10b98122" : "#ef444422" }]}>
                  <Feather name={tx.type === "DEPOSIT" ? "arrow-down-left" : "arrow-up-right"} size={16} color={tx.type === "DEPOSIT" ? "#10b981" : "#ef4444"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.txType}>{tx.type === "DEPOSIT" ? "Dépôt" : tx.type === "WITHDRAWAL" ? "Retrait" : tx.type}</Text>
                  <Text style={s.txDate}>{new Date(tx.createdAt).toLocaleDateString("fr-FR")}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[s.txAmt, { color: tx.type === "DEPOSIT" ? "#10b981" : "#ef4444" }]}>
                    {tx.type === "DEPOSIT" ? "+" : "-"}{tx.amount} {tx.currency}
                  </Text>
                  <View style={[s.txStatus, { backgroundColor: tx.status === "COMPLETED" ? "#10b98122" : "#f59e0b22" }]}>
                    <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: tx.status === "COMPLETED" ? "#10b981" : "#f59e0b" }}>
                      {tx.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = (c: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  greeting: { fontFamily: "Inter_700Bold", fontSize: 20, color: c.foreground },
  liveDot: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10b981" },
  liveText: { fontFamily: "Inter_500Medium", fontSize: 12, color: "#10b981" },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: c.card, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  balanceCard: {
    borderRadius: 20, padding: 20, marginBottom: 20,
    backgroundColor: c.primary,
    shadowColor: c.primary, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  balanceLabel: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 6 },
  balanceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  balanceValue: { fontFamily: "Inter_700Bold", fontSize: 26, color: "#fff", flex: 1 },
  balanceUSD: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4, marginBottom: 16 },
  actions: { flexDirection: "row", justifyContent: "space-between" },
  actionBtn: { alignItems: "center", gap: 6 },
  actionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17, color: c.foreground },
  liveChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#10b98122", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  liveChipText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: "#10b981" },
  seeAll: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: c.accent },
  priceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  priceCard: { flex: 1, minWidth: "45%", backgroundColor: c.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.border },
  priceCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cryptoIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cryptoIconText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  changeBadge: { fontFamily: "Inter_600SemiBold", fontSize: 11, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  priceCardSym: { fontFamily: "Inter_700Bold", fontSize: 15, color: c.foreground },
  priceCardVal: { fontFamily: "Inter_700Bold", fontSize: 18, color: c.foreground, marginTop: 4 },
  priceCardUnit: { fontFamily: "Inter_400Regular", fontSize: 11, color: c.mutedForeground },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: c.card, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: c.border },
  txIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  txType: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: c.foreground },
  txDate: { fontFamily: "Inter_400Regular", fontSize: 12, color: c.mutedForeground, marginTop: 2 },
  txAmt: { fontFamily: "Inter_700Bold", fontSize: 14 },
  txStatus: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 3 },
  empty: { alignItems: "center", paddingVertical: 32, gap: 10 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: c.mutedForeground },
});
