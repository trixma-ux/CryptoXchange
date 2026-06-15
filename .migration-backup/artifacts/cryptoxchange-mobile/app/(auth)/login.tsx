import { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e?.response?.data?.message || "Email ou mot de passe incorrect";
      Alert.alert("Connexion échouée", msg);
    } finally {
      setLoading(false);
    }
  };

  const s = styles(colors);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={s.logoArea}>
            <View style={s.logoCircle}>
              <Text style={s.logoText}>CX</Text>
            </View>
            <Text style={s.appName}>CryptoXchange</Text>
            <Text style={s.tagline}>Bienvenue ! Connectez-vous pour continuer</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Connexion</Text>

            <View style={s.field}>
              <Text style={s.label}>Email</Text>
              <View style={s.inputWrapper}>
                <Feather name="mail" size={16} color={colors.mutedForeground} style={{ marginLeft: 14 }} />
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="vous@exemple.com"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>Mot de passe</Text>
              <View style={s.inputWrapper}>
                <Feather name="lock" size={16} color={colors.mutedForeground} style={{ marginLeft: 14 }} />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPwd}
                  autoComplete="password"
                />
                <Pressable onPress={() => setShowPwd(!showPwd)} style={{ padding: 14 }}>
                  <Feather name={showPwd ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </View>

            <Pressable onPress={handleLogin} disabled={loading} style={[s.btn, loading && { opacity: 0.7 }]}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.btnText}>Se connecter</Text>
              )}
            </Pressable>

            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>ou</Text>
              <View style={s.dividerLine} />
            </View>

            <Pressable onPress={() => router.push("/(auth)/register")} style={s.link}>
              <Text style={s.linkText}>
                Pas encore de compte ? <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>S'inscrire</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = (c: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  logoArea: { alignItems: "center", paddingTop: 48, paddingBottom: 32 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: c.primary, alignItems: "center", justifyContent: "center",
    marginBottom: 12, shadowColor: c.primary, shadowOpacity: 0.5, shadowRadius: 16, elevation: 8,
  },
  logoText: { fontFamily: "Inter_700Bold", fontSize: 24, color: "#fff" },
  appName: { fontFamily: "Inter_700Bold", fontSize: 22, color: c.foreground, marginBottom: 6 },
  tagline: { fontFamily: "Inter_400Regular", fontSize: 14, color: c.mutedForeground, textAlign: "center" },
  card: { backgroundColor: c.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: c.border },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: c.foreground, marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, color: c.mutedForeground, marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: c.secondary, borderRadius: 12,
    borderWidth: 1, borderColor: c.border,
  },
  input: {
    flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, color: c.foreground,
    paddingVertical: 14, paddingHorizontal: 12,
  },
  btn: {
    backgroundColor: c.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: "center", marginTop: 8,
    shadowColor: c.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  btnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: c.border },
  dividerText: { fontFamily: "Inter_400Regular", fontSize: 13, color: c.mutedForeground, marginHorizontal: 12 },
  link: { alignItems: "center" },
  linkText: { fontFamily: "Inter_400Regular", fontSize: 14, color: c.mutedForeground },
});
