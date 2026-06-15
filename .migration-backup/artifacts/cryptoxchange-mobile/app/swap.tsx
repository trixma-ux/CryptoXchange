import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Pressable, ActivityIndicator, Alert, Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { swapAPI } from "@/lib/api";

const CRYPTOS = ["BTC", "ETH", "BNB", "SOL", "LTC", "XRP", "DOGE"];
const CRYPTO_COLORS: Record<string, string> = {
  BTC: "#f7931a", ETH: "#627eea", BNB: "#f3ba2f",
  SOL: "#9945ff", LTC: "#b9b9b9", XRP: "#00aae4", DOGE: "#c2a633",
};

export default function SwapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [fromCrypto, setFromCrypto] = useState("BTC");
  const [toCrypto, setToCrypto] = useState("ETH");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0 || fromCrypto === toCrypto) {
      setQuote(null); return;
    }
    const t = setTimeout(async () => {
      setLoadingQuote(true);
      try {
        const r = await swapAPI.getQuote({ fromCurrency: fromCrypto, toCurrency: toCrypto, amount: Number(amount) });
        setQuote(r.data?.data);
      } catch { setQuote(null); } finally { setLoadingQuote(false); }
    }, 700);
    return () => clearTimeout(t);
  }, [amount, fromCrypto, toCrypto]);

  const swapPair = () => {
    const tmp = fromCrypto;
    setFromCrypto(toCrypto);
    setToCrypto(tmp);
    setAmount("");
    setQuote(null);
  };

  const handleSubmit = async () => {
    if (!quote) return;
    setSubmitting(true);
    try {
      await swapAPI.execute({ fromCurrency: fromCrypto, toCurrency: toCrypto, amount: Number(amount) });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Succès !", `Échange ${fromCrypto} → ${toCrypto} effectué !`);
      setAmount(""); setQuote(null); router.back();
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur", e?.response?.data?.message || "Échange échoué");
    } finally { setSubmitting(false); }
  };

  const s = styles(colors);
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.closeBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={s.title}>Échanger</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* From */}
        <Text style={s.label}>De</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {CRYPTOS.map(sym => (
            <Pressable key={sym} onPress={() => { setFromCrypto(sym); if (sym === toCrypto) setToCrypto(CRYPTOS.find(c => c !== sym) || "ETH"); }}
              style={[s.chip, fromCrypto === sym && { backgroundColor: (CRYPTO_COLORS[sym] || colors.primary) + "33", borderColor: CRYPTO_COLORS[sym] || colors.primary }]}>
              <Text style={[s.chipText, fromCrypto === sym && { color: CRYPTO_COLORS[sym] || colors.primary, fontFamily: "Inter_700Bold" }]}>{sym}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={s.inputRow}>
          <TextInput style={s.input} value={amount} onChangeText={setAmount}
            placeholder="0.00" placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric" />
          <Text style={[s.inputUnit, { color: CRYPTO_COLORS[fromCrypto] || colors.accent }]}>{fromCrypto}</Text>
        </View>

        {/* Swap icon */}
        <Pressable onPress={swapPair} style={s.swapIcon}>
          <Feather name="repeat" size={20} color={colors.primary} />
        </Pressable>

        {/* To */}
        <Text style={s.label}>Vers</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {CRYPTOS.filter(c => c !== fromCrypto).map(sym => (
            <Pressable key={sym} onPress={() => setToCrypto(sym)}
              style={[s.chip, toCrypto === sym && { backgroundColor: (CRYPTO_COLORS[sym] || colors.primary) + "33", borderColor: CRYPTO_COLORS[sym] || colors.primary }]}>
              <Text style={[s.chipText, toCrypto === sym && { color: CRYPTO_COLORS[sym] || colors.primary, fontFamily: "Inter_700Bold" }]}>{sym}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Quote */}
        {(loadingQuote || quote) && (
          <View style={s.quoteBox}>
            {loadingQuote ? <ActivityIndicator color={colors.primary} /> : quote && (
              <>
                <Text style={s.quoteTitle}>Estimation</Text>
                <View style={s.quoteRow}>
                  <Text style={s.quoteLabel}>Vous donnez</Text>
                  <Text style={[s.quoteVal, { color: CRYPTO_COLORS[fromCrypto] }]}>{amount} {fromCrypto}</Text>
                </View>
                <View style={s.quoteRow}>
                  <Text style={s.quoteLabel}>Vous recevez</Text>
                  <Text style={[s.quoteVal, { color: CRYPTO_COLORS[toCrypto] }]}>{quote.toAmount} {toCrypto}</Text>
                </View>
                <View style={s.quoteRow}>
                  <Text style={s.quoteLabel}>Taux</Text>
                  <Text style={s.quoteVal}>1 {fromCrypto} ≈ {quote.rate} {toCrypto}</Text>
                </View>
                <View style={s.quoteRow}>
                  <Text style={s.quoteLabel}>Frais</Text>
                  <Text style={s.quoteVal}>{quote.fee || "0.1%"}</Text>
                </View>
              </>
            )}
          </View>
        )}

        <Pressable onPress={handleSubmit} disabled={!quote || submitting}
          style={[s.btn, (!quote || submitting) && { opacity: 0.5 }]}>
          {submitting ? <ActivityIndicator color="#fff" /> : (
            <Text style={s.btnText}>Confirmer l'échange</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = (c: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16 },
  closeBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: c.card, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 20, color: c.foreground },
  scroll: { paddingHorizontal: 20, paddingBottom: 60 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: c.mutedForeground, marginBottom: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, backgroundColor: c.card, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: c.border },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: c.mutedForeground },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, marginBottom: 8 },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 16, color: c.foreground, paddingVertical: 14, paddingHorizontal: 16 },
  inputUnit: { fontFamily: "Inter_700Bold", fontSize: 15, paddingRight: 16 },
  swapIcon: { alignSelf: "center", width: 44, height: 44, borderRadius: 14, backgroundColor: c.primary + "22", borderWidth: 1, borderColor: c.primary, alignItems: "center", justifyContent: "center", marginVertical: 4 },
  quoteBox: { backgroundColor: c.card, borderRadius: 14, padding: 16, marginVertical: 16, borderWidth: 1, borderColor: c.border },
  quoteTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: c.foreground, marginBottom: 12 },
  quoteRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  quoteLabel: { fontFamily: "Inter_400Regular", fontSize: 14, color: c.mutedForeground },
  quoteVal: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: c.foreground },
  btn: { backgroundColor: c.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center", shadowColor: c.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  btnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
});
