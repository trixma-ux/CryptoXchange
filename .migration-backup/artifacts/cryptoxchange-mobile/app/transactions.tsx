import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  RefreshControl, ActivityIndicator, Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { transactionsAPI } from "@/lib/api";

const TX_TYPES = ["Tous", "DEPOSIT", "WITHDRAWAL", "BUY", "SELL", "SWAP"];
const TX_LABELS: Record<string, string> = {
  DEPOSIT: "Dépôt", WITHDRAWAL: "Retrait", BUY: "Achat", SELL: "Vente", SWAP: "Échange",
};

export default function TransactionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("Tous");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = async (reset = false) => {
    const p = reset ? 1 : page;
    try {
      const res = await transactionsAPI.getAll({
        page: p, limit: 20,
        ...(filter !== "Tous" ? { type: filter } : {}),
      });
      const data = res.data?.data?.transactions || [];
      setTransactions(prev => reset ? data : [...prev, ...data]);
      setHasMore(data.length === 20);
      if (!reset) setPage(p + 1);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setTransactions([]);
    setLoading(true);
    load(true);
  }, [filter]);

  const s = styles(colors);
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const renderTx = ({ item: tx }: { item: any }) => {
    const isPositive = ["DEPOSIT", "BUY"].includes(tx.type);
    const label = TX_LABELS[tx.type] || tx.type;
    return (
      <View style={s.txRow}>
        <View style={[s.txIcon, { backgroundColor: isPositive ? "#10b98122" : "#ef444422" }]}>
          <Feather name={isPositive ? "arrow-down-left" : "arrow-up-right"} size={16} color={isPositive ? "#10b981" : "#ef4444"} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.txLabel}>{label}</Text>
          <Text style={s.txDate}>{new Date(tx.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[s.txAmount, { color: isPositive ? "#10b981" : "#ef4444" }]}>
            {isPositive ? "+" : "-"}{tx.amount} {tx.currency}
          </Text>
          <View style={[s.statusBadge, { backgroundColor: tx.status === "COMPLETED" ? "#10b98122" : tx.status === "PENDING" ? "#f59e0b22" : "#ef444422" }]}>
            <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: tx.status === "COMPLETED" ? "#10b981" : tx.status === "PENDING" ? "#f59e0b" : "#ef4444" }}>
              {tx.status}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={s.title}>Transactions</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Filters */}
      <FlatList
        data={TX_TYPES}
        horizontal showsHorizontalScrollIndicator={false}
        keyExtractor={i => i}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => setFilter(item)} style={[s.filterChip, filter === item && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
            <Text style={[s.filterText, filter === item && { color: "#fff" }]}>{item === "Tous" ? item : TX_LABELS[item] || item}</Text>
          </Pressable>
        )}
      />

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={i => i.id}
          renderItem={renderTx}
          contentContainerStyle={[s.list, isWeb && { paddingBottom: 34 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setPage(1); load(true); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name="inbox" size={36} color={colors.mutedForeground} />
              <Text style={s.emptyText}>Aucune transaction</Text>
            </View>
          }
          onEndReached={() => { if (hasMore && !loading) load(); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={hasMore ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} /> : null}
        />
      )}
    </View>
  );
}

const styles = (c: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: c.card, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 20, color: c.foreground },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: c.card, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: c.border },
  filterText: { fontFamily: "Inter_500Medium", fontSize: 13, color: c.mutedForeground },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: c.card, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: c.border },
  txIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  txLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: c.foreground },
  txDate: { fontFamily: "Inter_400Regular", fontSize: 12, color: c.mutedForeground, marginTop: 2 },
  txAmount: { fontFamily: "Inter_700Bold", fontSize: 14 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 3 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 15, color: c.mutedForeground },
});
