import { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const COUNTRIES = ["Côte d'Ivoire", "Sénégal", "Mali", "Burkina Faso", "Ghana", "Bénin", "Togo", "Niger", "Cameroun", "Autre"];

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", country: "Côte d'Ivoire", phone: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }
    if (form.password.length < 8) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    setLoading(true);
    try {
      await register({ ...form, email: form.email.trim().toLowerCase() });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Inscription échouée", e?.response?.data?.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const s = styles(colors);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.back}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={s.logoCircle}>
            <Text style={s.logoText}>CX</Text>
          </View>
          <Text style={s.title}>Créer un compte</Text>
          <Text style={s.subtitle}>Rejoignez CryptoXchange gratuitement</Text>
        </View>

        <View style={s.card}>
          <View style={s.row}>
            <View style={[s.field, { flex: 1, marginRight: 8 }]}>
              <Text style={s.label}>Prénom *</Text>
              <TextInput style={s.input} value={form.firstName} onChangeText={set("firstName")}
                placeholder="Jean" placeholderTextColor={colors.mutedForeground} />
            </View>
            <View style={[s.field, { flex: 1, marginLeft: 8 }]}>
              <Text style={s.label}>Nom *</Text>
              <TextInput style={s.input} value={form.lastName} onChangeText={set("lastName")}
                placeholder="Dupont" placeholderTextColor={colors.mutedForeground} />
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Email *</Text>
            <View style={s.inputRow}>
              <Feather name="mail" size={16} color={colors.mutedForeground} style={{ marginLeft: 14 }} />
              <TextInput style={[s.input, { flex: 1, borderWidth: 0 }]} value={form.email} onChangeText={set("email")}
                placeholder="vous@exemple.com" placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none" keyboardType="email-address" />
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Téléphone</Text>
            <View style={s.inputRow}>
              <Feather name="phone" size={16} color={colors.mutedForeground} style={{ marginLeft: 14 }} />
              <TextInput style={[s.input, { flex: 1, borderWidth: 0 }]} value={form.phone} onChangeText={set("phone")}
                placeholder="+225 07 00 00 00" placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad" />
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Mot de passe *</Text>
            <View style={s.inputRow}>
              <Feather name="lock" size={16} color={colors.mutedForeground} style={{ marginLeft: 14 }} />
              <TextInput style={[s.input, { flex: 1, borderWidth: 0 }]} value={form.password} onChangeText={set("password")}
                placeholder="Min. 8 caractères" placeholderTextColor={colors.mutedForeground} secureTextEntry={!showPwd} />
              <Pressable onPress={() => setShowPwd(!showPwd)} style={{ padding: 14 }}>
                <Feather name={showPwd ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Pays</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
              {COUNTRIES.map(c => (
                <Pressable key={c} onPress={() => set("country")(c)} style={[s.chip, form.country === c && s.chipActive]}>
                  <Text style={[s.chipText, form.country === c && s.chipTextActive]}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <Pressable onPress={handleRegister} disabled={loading} style={[s.btn, loading && { opacity: 0.7 }]}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Créer mon compte</Text>}
          </Pressable>

          <Pressable onPress={() => router.push("/(auth)/login")} style={s.link}>
            <Text style={s.linkText}>
              Déjà un compte ? <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Se connecter</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = (c: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  header: { alignItems: "center", paddingTop: 16, paddingBottom: 28, position: "relative" },
  back: { position: "absolute", left: 0, top: 16, padding: 4 },
  logoCircle: { width: 60, height: 60, borderRadius: 16, backgroundColor: c.primary, alignItems: "center", justifyContent: "center", marginBottom: 12, shadowColor: c.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  logoText: { fontFamily: "Inter_700Bold", fontSize: 20, color: "#fff" },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, color: c.foreground, marginBottom: 4 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: c.mutedForeground },
  card: { backgroundColor: c.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: c.border },
  row: { flexDirection: "row" },
  field: { marginBottom: 14 },
  label: { fontFamily: "Inter_500Medium", fontSize: 12, color: c.mutedForeground, marginBottom: 6 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: c.secondary, borderRadius: 12, borderWidth: 1, borderColor: c.border },
  input: { fontFamily: "Inter_400Regular", fontSize: 15, color: c.foreground, paddingVertical: 13, paddingHorizontal: 14, backgroundColor: c.secondary, borderRadius: 12, borderWidth: 1, borderColor: c.border },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: c.border, marginRight: 8, backgroundColor: c.secondary },
  chipActive: { backgroundColor: c.primary, borderColor: c.primary },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: c.mutedForeground },
  chipTextActive: { color: "#fff" },
  btn: { backgroundColor: c.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8, shadowColor: c.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  btnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  link: { alignItems: "center", marginTop: 16 },
  linkText: { fontFamily: "Inter_400Regular", fontSize: 14, color: c.mutedForeground },
});
