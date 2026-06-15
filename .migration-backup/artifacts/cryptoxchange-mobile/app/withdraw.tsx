import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Pressable, ActivityIndicator, Alert, Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { paymentsAPI } from "@/lib/api";

const PROVIDERS = [
  { id: "orange_money", label: "Orange Money", color: "#ff6600" },
  { id: "mtn_momo", label: "MTN MoMo", color: "#ffcc00" },
  { id: "wave", label: "Wave", color: "#1ba0e2" },
  { id: "moov_money", label: "Moov Money", color: "#00a651" },
];

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000];

export default function WithdrawScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [provider, setProvider] = useState("orange_money");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!phone || !amount || Number(amount) < 1000) {
      Alert.alert("Erreur", "Numéro de téléphone requis et montant minimum de 1000 FCFA");
      return;
    }
    setSubmitting(true);
    try {
      await paymentsAPI.mobileMoneyWithdrawal({ provider, phone, amount: Number(amount) });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Retrait initié", `Votre retrait de ${Number(amount).toLocaleString("fr-FR")} FCFA est en cours de traitement.`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur", e?.response?.data?.message || "Retrait échoué");
    } finally { setSubmitting(false); }
  };

  const s = styles(colors);
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const selectedProvider = PROVIDERS.find(p => p.id === provider)!;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.closeBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={s.title}>Retirer des fonds</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.warningBox}>
          <Feather name="alert-triangle" size={14} color="#f59e0b" />
          <Text style={s.warningText}>Les retraits sont traités sous 24h. Frais : 0.5% de la plateforme.</Text>
        </View>

        <Text style={s.label}>Opérateur</Text>
        <View style={s.providerGrid}>
          {PROVIDERS.map(p => (
            <Pressable key={p.id} onPress={() => setProvider(p.id)} style={[s.providerCard, provider === p.id && { borderColor: p.color, backgroundColor: p.color + "15" }]}>
              <View style={[s.dot, { backgroundColor: p.color }]} />
              <Text style={[s.providerLabel, provider === p.id && { color: p.color, fontFamily: "Inter_700Bold" }]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.label}>Numéro Mobile Money</Text>
        <View style={s.inputRow}>
          <Feather name="phone" size={16} color={colors.mutedForeground} style={{ marginLeft: 14 }} />
          <TextInput style={[s.input, { flex: 1 }]} value={phone} onChangeText={setPhone}
            placeholder="+225 07 00 00 00" placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad" />
        </View>

        <Text style={s.label}>Montant à retirer (FCFA)</Text>
        <View style={s.inputRow}>
          <TextInput style={s.input} value={amount} onChangeText={setAmount}
            placeholder="Ex: 10000" placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric" />
          <Text style={s.inputUnit}>FCFA</Text>
        </View>

        <View style={s.quickRow}>
          {QUICK_AMOUNTS.map(v => (
            <Pressable key={v} onPress={() => setAmount(String(v))} style={[s.quickBtn, amount === String(v) && { backgroundColor: selectedProvider.color + "22", borderColor: selectedProvider.color }]}>
              <Text style={[s.quickText, amount === String(v) && { color: selectedProvider.color }]}>{(v / 1000).toFixed(0)}K</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={handleSubmit} disabled={submitting} style={[s.btn, submitting && { opacity: 0.6 }]}>
          {submitting ? <ActivityIndicator color="#fff" /> : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Feather name="arrow-up-circle" size={18} color="#fff" />
              <Text style={s.btnText}>Demander le retrait</Text>
            </View>
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
  warningBox: { flexDirection: "row", gap: 8, backgroundColor: "#f59e0b15", borderRadius: 10, padding: 12, marginBottom: 20, alignItems: "flex-start", borderWidth: 1, borderColor: "#f59e0b30" },
  warningText: { fontFamily: "Inter_400Regular", fontSize: 12, color: c.mutedForeground, flex: 1, lineHeight: 18 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: c.mutedForeground, marginBottom: 10 },
  providerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  providerCard: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border },
  dot: { width: 8, height: 8, borderRadius: 4 },
  providerLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: c.mutedForeground },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, marginBottom: 16 },
  input: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, color: c.foreground, paddingVertical: 14, paddingHorizontal: 16 },
  inputUnit: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: c.mutedForeground, paddingRight: 16 },
  quickRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  quickBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, alignItems: "center" },
  quickText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: c.mutedForeground },
  btn: { backgroundColor: "#8b5cf6", borderRadius: 14, paddingVertical: 16, alignItems: "center", shadowColor: "#8b5cf6", shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  btnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
});
