import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable,
  ActivityIndicator, Alert, Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { tradingAPI, pricesAPI } from "@/lib/api";

const CRYPTOS = [
  { sym: "BTC", name: "Bitcoin", color: "#f7931a" },
  { sym: "ETH", name: "Ethereum", color: "#627eea" },
  { sym: "BNB", name: "BNB", color: "#f3ba2f" },
  { sym: "SOL", name: "Solana", color: "#9945ff" },
  { sym: "LTC", name: "Litecoin", color: "#b9b9b9" },
  { sym: "XRP", name: "Ripple", color: "#00aae4" },
  { sym: "DOGE", name: "Dogecoin", color: "#c2a633" },
];

const PAYMENT_METHODS = [
  { id: "orange_money", label: "Orange Money", icon: "smartphone" as const },
  { id: "mtn_momo", label: "MTN MoMo", icon: "smartphone" as const },
  { id: "wave", label: "Wave", icon: "zap" as const },
  { id: "moov_money", label: "Moov Money", icon: "smartphone" as const },
];

function formatXOF(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

export default function TradeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTOS[0]);
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("orange_money");

  const currentPrice = prices[selectedCrypto.sym];

  useEffect(() => {
    pricesAPI.getPrices()
      .then(r => {
        const map: Record<string, any> = {};
        (r.data?.data || []).forEach((p: any) => { map[p.currency] = p; });
        setPrices(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setQuote(null);
      return;
    }
    const t = setTimeout(async () => {
      setLoadingQuote(true);
      try {
        let r;
        if (mode === "buy") {
          r = await tradingAPI.getBuyQuote({ currency: selectedCrypto.sym, fiatAmount: Number(amount) });
        } else {
          // For sell: user enters FCFA, convert to crypto using current price
          const priceFCFA = currentPrice?.priceFCFA || 1;
          const cryptoAmt = parseFloat((Number(amount) / priceFCFA).toFixed(8));
          r = await tradingAPI.getSellQuote({ currency: selectedCrypto.sym, cryptoAmount: cryptoAmt });
        }
        setQuote(r.data?.data);
      } catch { setQuote(null); } finally { setLoadingQuote(false); }
    }, 700);
    return () => clearTimeout(t);
  }, [amount, selectedCrypto, mode, currentPrice]);

  const handleSubmit = async () => {
    if (!quote) return;
    setSubmitting(true);
    try {
      if (mode === "buy") {
        await tradingAPI.buy({ currency: selectedCrypto.sym, fiatAmount: quote.fiatAmount, paymentMethod });
      } else {
        await tradingAPI.sell({ currency: selectedCrypto.sym, cryptoAmount: quote.cryptoAmount });
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Succès !", mode === "buy" ? `${selectedCrypto.sym} acheté avec succès !` : `${selectedCrypto.sym} vendu avec succès !`);
      setAmount("");
      setQuote(null);
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur", e?.response?.data?.message || "Une erreur est survenue");
    } finally { setSubmitting(false); }
  };

  const s = styles(colors);
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Text style={s.title}>Trader</Text>
        <View style={s.modeSwitch}>
          <Pressable onPress={() => setMode("buy")} style={[s.modeBtn, mode === "buy" && s.modeBtnBuy]}>
            <Text style={[s.modeBtnText, mode === "buy" && { color: "#fff" }]}>Acheter</Text>
          </Pressable>
          <Pressable onPress={() => setMode("sell")} style={[s.modeBtn, mode === "sell" && s.modeBtnSell]}>
            <Text style={[s.modeBtnText, mode === "sell" && { color: "#fff" }]}>Vendre</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, isWeb && { paddingBottom: 34 }]} keyboardShouldPersistTaps="handled">

        {/* Crypto Selector */}
        <Text style={s.sectionLabel}>Cryptomonnaie</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {CRYPTOS.map(c => (
            <Pressable key={c.sym} onPress={() => setSelectedCrypto(c)} style={[s.cryptoChip, selectedCrypto.sym === c.sym && { backgroundColor: c.color + "33", borderColor: c.color }]}>
              <View style={[s.cryptoDot, { backgroundColor: c.color }]} />
              <Text style={[s.cryptoChipText, selectedCrypto.sym === c.sym && { color: c.color, fontFamily: "Inter_700Bold" }]}>{c.sym}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Price Display */}
        <View style={s.priceBox}>
          <View style={[s.priceLeft, { borderLeftColor: selectedCrypto.color }]}>
            <Text style={s.priceLabel}>Prix actuel ({selectedCrypto.sym})</Text>
            <Text style={[s.priceValue, { color: selectedCrypto.color }]}>
              {currentPrice ? formatXOF(currentPrice.priceFCFA) + " FCFA" : "—"}
            </Text>
            {currentPrice && (
              <Text style={[s.changeText, { color: currentPrice.change24h >= 0 ? "#10b981" : "#ef4444" }]}>
                {currentPrice.change24h >= 0 ? "▲ +" : "▼ "}{Math.abs(currentPrice.change24h || 0).toFixed(2)}% (24h)
              </Text>
            )}
          </View>
          {currentPrice && (
            <View style={s.priceRight}>
              <Text style={s.usdLabel}>${currentPrice.priceUSD < 1 ? currentPrice.priceUSD.toFixed(4) : currentPrice.priceUSD.toLocaleString("en-US")}</Text>
              <Text style={[s.sourceTag, { color: currentPrice.source === "live" ? "#10b981" : colors.mutedForeground }]}>
                {currentPrice.source === "live" ? "● Live" : "● Mock"}
              </Text>
            </View>
          )}
        </View>

        {/* Amount Input */}
        <Text style={s.sectionLabel}>Montant en FCFA</Text>
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="Ex: 10000"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
          />
          <Text style={s.inputUnit}>FCFA</Text>
        </View>

        {/* Quick amounts */}
        <View style={s.quickAmounts}>
          {["5000", "10000", "25000", "50000"].map(v => (
            <Pressable key={v} onPress={() => setAmount(v)} style={[s.quickAmt, amount === v && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <Text style={[s.quickAmtText, amount === v && { color: "#fff" }]}>{parseInt(v).toLocaleString("fr-FR")}</Text>
            </Pressable>
          ))}
        </View>

        {/* Payment Method (buy only) */}
        {mode === "buy" && (
          <>
            <Text style={s.sectionLabel}>Méthode de paiement</Text>
            <View style={s.paymentGrid}>
              {PAYMENT_METHODS.map(pm => (
                <Pressable key={pm.id} onPress={() => setPaymentMethod(pm.id)} style={[s.pmCard, paymentMethod === pm.id && { borderColor: colors.primary, backgroundColor: colors.primary + "15" }]}>
                  <Feather name={pm.icon} size={16} color={paymentMethod === pm.id ? colors.primary : colors.mutedForeground} />
                  <Text style={[s.pmText, paymentMethod === pm.id && { color: colors.primary }]}>{pm.label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Quote */}
        {(loadingQuote || quote) && (
          <View style={s.quoteBox}>
            {loadingQuote ? (
              <ActivityIndicator color={colors.primary} />
            ) : quote && (
              <>
                <Text style={s.quoteTitle}>Récapitulatif</Text>
                <View style={s.quoteRow}>
                  <Text style={s.quoteLabel}>{mode === "buy" ? "Vous payez" : "Vous recevez"}</Text>
                  <Text style={s.quoteValue}>{formatXOF(quote.fiatAmount || 0)} FCFA</Text>
                </View>
                <View style={s.quoteRow}>
                  <Text style={s.quoteLabel}>{mode === "buy" ? "Vous recevez" : "Vous vendez"}</Text>
                  <Text style={[s.quoteValue, { color: selectedCrypto.color }]}>
                    {typeof quote.cryptoAmount === "number" ? quote.cryptoAmount.toFixed(8) : quote.cryptoAmount} {selectedCrypto.sym}
                  </Text>
                </View>
                <View style={s.quoteRow}>
                  <Text style={s.quoteLabel}>Frais (2%)</Text>
                  <Text style={s.quoteValue}>
                    {formatXOF(Math.round((quote.fee || 0) * (currentPrice?.priceFCFA ? 1 / (currentPrice.priceUSD || 1) * currentPrice.priceFCFA : 600)))} FCFA
                  </Text>
                </View>
                <View style={[s.quoteRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 4 }]}>
                  <Text style={[s.quoteLabel, { fontFamily: "Inter_700Bold", color: colors.foreground }]}>Total</Text>
                  <Text style={[s.quoteValue, { fontFamily: "Inter_700Bold", color: colors.foreground }]}>{formatXOF(quote.fiatAmount || 0)} FCFA</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Submit */}
        <Pressable
          onPress={handleSubmit}
          disabled={!quote || submitting}
          style={[s.submitBtn, { backgroundColor: mode === "buy" ? "#10b981" : "#ef4444" }, (!quote || submitting) && { opacity: 0.5 }]}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : (
            <Text style={s.submitText}>{mode === "buy" ? `Acheter ${selectedCrypto.sym}` : `Vendre ${selectedCrypto.sym}`}</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const c = (colors: ReturnType<typeof useColors>) => colors;

const styles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 24, color: colors.foreground },
  modeSwitch: { flexDirection: "row", backgroundColor: colors.card, borderRadius: 10, padding: 3 },
  modeBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8 },
  modeBtnBuy: { backgroundColor: "#10b981" },
  modeBtnSell: { backgroundColor: "#ef4444" },
  modeBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.mutedForeground },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.mutedForeground, marginBottom: 10 },
  cryptoChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.card, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  cryptoDot: { width: 7, height: 7, borderRadius: 4 },
  cryptoChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: colors.mutedForeground },
  priceBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  priceLeft: { borderLeftWidth: 3, paddingLeft: 12 },
  priceLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground },
  priceValue: { fontFamily: "Inter_700Bold", fontSize: 18, marginTop: 3 },
  changeText: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 3 },
  priceRight: { alignItems: "flex-end" },
  usdLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.foreground },
  sourceTag: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 3 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 16, color: colors.foreground, paddingVertical: 14, paddingHorizontal: 16 },
  inputUnit: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.mutedForeground, paddingRight: 16 },
  quickAmounts: { flexDirection: "row", gap: 8, marginBottom: 20 },
  quickAmt: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  quickAmtText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.mutedForeground },
  paymentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  pmCard: { flex: 1, minWidth: "45%", flexDirection: "row", alignItems: "center", gap: 8, padding: 12, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  pmText: { fontFamily: "Inter_500Medium", fontSize: 13, color: colors.mutedForeground },
  quoteBox: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  quoteTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: colors.foreground, marginBottom: 12 },
  quoteRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  quoteLabel: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.mutedForeground },
  quoteValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.foreground },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  submitText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
});
