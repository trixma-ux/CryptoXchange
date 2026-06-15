import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Alert, Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

const KYC_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "#f59e0b" },
  VERIFIED: { label: "Vérifié ✓", color: "#10b981" },
  REJECTED: { label: "Rejeté", color: "#ef4444" },
  NOT_SUBMITTED: { label: "Non soumis", color: "#94a3b8" },
};

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnecter", style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const kyc = KYC_LABELS[user?.kycStatus || "NOT_SUBMITTED"] || KYC_LABELS.NOT_SUBMITTED;
  const s = styles(colors);
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const MENU_ITEMS = [
    { icon: "shield" as const, label: "Vérification KYC", value: kyc.label, valueColor: kyc.color, action: () => {} },
    { icon: "bell" as const, label: "Notifications", action: () => {} },
    { icon: "lock" as const, label: "Sécurité & Mot de passe", action: () => {} },
    { icon: "headphones" as const, label: "Support", action: () => router.push("/support") },
    { icon: "list" as const, label: "Historique complet", action: () => router.push("/transactions") },
  ];

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <Text style={[s.title, { paddingHorizontal: 20 }]}>Profil</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, isWeb && { paddingBottom: 34 }]}>
        {/* Avatar Card */}
        <View style={s.avatarCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {(user?.firstName?.[0] || "") + (user?.lastName?.[0] || "")}
            </Text>
          </View>
          <Text style={s.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={s.email}>{user?.email}</Text>

          <View style={s.badges}>
            <View style={[s.badge, { backgroundColor: kyc.color + "22" }]}>
              <Feather name="check-circle" size={12} color={kyc.color} />
              <Text style={[s.badgeText, { color: kyc.color }]}>{kyc.label}</Text>
            </View>
            {user?.twoFactorEnabled && (
              <View style={[s.badge, { backgroundColor: "#10b98122" }]}>
                <Feather name="shield" size={12} color="#10b981" />
                <Text style={[s.badgeText, { color: "#10b981" }]}>2FA activé</Text>
              </View>
            )}
            <View style={[s.badge, { backgroundColor: "#6366f122" }]}>
              <Feather name="user" size={12} color="#6366f1" />
              <Text style={[s.badgeText, { color: "#6366f1" }]}>{user?.role || "USER"}</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={s.menuCard}>
          {MENU_ITEMS.map((item, idx) => (
            <Pressable key={idx} onPress={item.action} style={[s.menuItem, idx < MENU_ITEMS.length - 1 && s.menuItemBorder]}>
              <View style={[s.menuIcon, { backgroundColor: colors.secondary }]}>
                <Feather name={item.icon} size={18} color={colors.primary} />
              </View>
              <Text style={s.menuLabel}>{item.label}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {item.value && <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: item.valueColor || colors.mutedForeground }}>{item.value}</Text>}
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </View>
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable onPress={handleLogout} disabled={loggingOut} style={s.logoutBtn}>
          <Feather name="log-out" size={18} color="#ef4444" />
          <Text style={s.logoutText}>{loggingOut ? "Déconnexion..." : "Se déconnecter"}</Text>
        </Pressable>

        <Text style={s.footer}>CryptoXchange v1.0.0 · Données par CoinGecko</Text>
      </ScrollView>
    </View>
  );
}

const styles = (c: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  title: { fontFamily: "Inter_700Bold", fontSize: 24, color: c.foreground, marginBottom: 16 },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  avatarCard: { backgroundColor: c.card, borderRadius: 20, padding: 24, alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: c.border },
  avatar: { width: 72, height: 72, borderRadius: 22, backgroundColor: c.primary, alignItems: "center", justifyContent: "center", marginBottom: 12, shadowColor: c.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 26, color: "#fff" },
  name: { fontFamily: "Inter_700Bold", fontSize: 20, color: c.foreground, marginBottom: 4 },
  email: { fontFamily: "Inter_400Regular", fontSize: 14, color: c.mutedForeground, marginBottom: 14 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  menuCard: { backgroundColor: c.card, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: c.border, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontFamily: "Inter_500Medium", fontSize: 15, color: c.foreground, flex: 1 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 16, backgroundColor: "#ef444415", borderRadius: 14, borderWidth: 1, borderColor: "#ef444430", marginBottom: 24 },
  logoutText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#ef4444" },
  footer: { fontFamily: "Inter_400Regular", fontSize: 12, color: c.mutedForeground, textAlign: "center", marginBottom: 8 },
});
