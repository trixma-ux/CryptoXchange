import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, ActivityIndicator, Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { walletsAPI } from "@/lib/api";

const CRYPTO_COLORS: Record<string, string> = {
  BTC: "#f7931a", ETH: "#627eea", USDT_TRC20: "#26a17b", USDT_ERC20: "#26a17b",
  BNB: "#f3ba2f", SOL: "#9945ff", LTC: "#b9b9b9", XRP: "#00aae4", DOGE: "#c2a633",
};

const CRYPTO_NAMES: Record<string, string> = {
  BTC: "Bitcoin", ETH: "Ethereum", USDT_TRC20: "Tether TRC20",
  USDT_ERC20: "Tether ERC20", BNB: "BNB", SOL: "Solana",
  LTC: "Litecoin", XRP: "Ripple", DOGE: "Dogecoin",
};

function formatXOF(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);
}

export default function WalletsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await walletsAPI.getPortfolio();
      setPortfolio(res.data?.data);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const s = styles(colors);
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Text style={s.title}>Portefeuilles</Text>
        <Text style={s.subtitle}>
          {loading ? "—" : `${portfolio?.wallets?.length || 0} actif${(portfolio?.wallets?.length || 0) > 1 ? "s" : ""}`}
        </Text>
      </View>

      {/* Total */}
      {!loading && portfolio && (
        <View style={s.totalCard}>
          <Text style={s.totalLabel}>Valeur totale</Text>
          <Text style={s.totalValue}>{formatXOF(portfolio.totalValueXOF || 0)} FCFA</Text>
          <Text style={s.totalUSD}>≈ ${(portfolio.totalValueUSD || 0).toFixed(2)}</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, isWeb && { paddingBottom: 34 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : portfolio?.wallets?.length ? (
          portfolio.wallets.map((wallet: any) => {
            const color = CRYPTO_COLORS[wallet.currency] || "#f59e0b";
            const sym = wallet.currency.replace("_TRC20", "").replace("_ERC20", "");
            return (
              <Pressable key={wallet.id} style={s.walletCard}>
                <View style={[s.walletIcon, { backgroundColor: color + "22" }]}>
                  <Text style={[s.walletIconText, { color }]}>{sym[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.walletName}>{sym}</Text>
                  <Text style={s.walletFullName}>{CRYPTO_NAMES[wallet.currency] || wallet.currency}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={s.walletBalance}>
                    {parseFloat(wallet.balance).toFixed(wallet.currency.includes("USDT") ? 2 : 8)} {sym}
                  </Text>
                  <Text style={s.walletValueXOF}>{formatXOF(wallet.valueXOF || 0)} FCFA</Text>
                  <Text style={s.walletValueUSD}>≈ ${(wallet.valueUSD || 0).toFixed(2)}</Text>
                </View>
              </Pressable>
            );
          })
        ) : (
          <View style={s.empty}>
            <Feather name="credit-card" size={40} color={colors.mutedForeground} />
            <Text style={s.emptyTitle}>Aucun portefeuille</Text>
            <Text style={s.emptyText}>Créez un portefeuille pour commencer à trader</Text>
            <Pressable onPress={() => router.push("/deposit")} style={s.createBtn}>
              <Text style={s.createBtnText}>Déposer des fonds</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = (c: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontFamily: "Inter_700Bold", fontSize: 24, color: c.foreground },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: c.mutedForeground, marginTop: 2 },
  totalCard: { marginHorizontal: 20, marginBottom: 16, backgroundColor: c.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: c.border },
  totalLabel: { fontFamily: "Inter_400Regular", fontSize: 13, color: c.mutedForeground },
  totalValue: { fontFamily: "Inter_700Bold", fontSize: 26, color: c.foreground, marginTop: 4 },
  totalUSD: { fontFamily: "Inter_400Regular", fontSize: 13, color: c.mutedForeground, marginTop: 3 },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  walletCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, backgroundColor: c.card, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: c.border },
  walletIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  walletIconText: { fontFamily: "Inter_700Bold", fontSize: 18 },
  walletName: { fontFamily: "Inter_700Bold", fontSize: 15, color: c.foreground },
  walletFullName: { fontFamily: "Inter_400Regular", fontSize: 12, color: c.mutedForeground, marginTop: 2 },
  walletBalance: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: c.foreground },
  walletValueXOF: { fontFamily: "Inter_500Medium", fontSize: 12, color: "#10b981", marginTop: 2 },
  walletValueUSD: { fontFamily: "Inter_400Regular", fontSize: 11, color: c.mutedForeground },
  empty: { alignItems: "center", paddingTop: 60, gap: 10, paddingHorizontal: 20 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: c.foreground, marginTop: 8 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: c.mutedForeground, textAlign: "center" },
  createBtn: { marginTop: 12, backgroundColor: c.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  createBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
});
