import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  ActivityIndicator, Alert, Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { supportAPI } from "@/lib/api";

export default function SupportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await supportAPI.getTickets();
      setTickets(res.data?.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Erreur", "Renseignez un sujet et un message");
      return;
    }
    setSubmitting(true);
    try {
      await supportAPI.createTicket({ subject, message });
      Alert.alert("Ticket créé", "Votre demande a été envoyée. Notre équipe vous répondra sous 24h.");
      setSubject(""); setMessage(""); setShowForm(false);
      load();
    } catch (e: any) {
      Alert.alert("Erreur", e?.response?.data?.message || "Envoi échoué");
    } finally { setSubmitting(false); }
  };

  const STATUS_COLORS: Record<string, string> = { OPEN: "#10b981", PENDING: "#f59e0b", CLOSED: "#94a3b8" };
  const s = styles(colors);
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={s.title}>Support</Text>
        <Pressable onPress={() => setShowForm(f => !f)} style={[s.addBtn, showForm && { backgroundColor: "#ef444422" }]}>
          <Feather name={showForm ? "x" : "plus"} size={20} color={showForm ? "#ef4444" : colors.primary} />
        </Pressable>
      </View>

      {showForm && (
        <View style={s.form}>
          <Text style={s.label}>Sujet</Text>
          <TextInput style={s.input} value={subject} onChangeText={setSubject}
            placeholder="Décrivez votre problème en quelques mots" placeholderTextColor={colors.mutedForeground} />
          <Text style={s.label}>Message</Text>
          <TextInput style={[s.input, s.textarea]} value={message} onChangeText={setMessage}
            placeholder="Détaillez votre demande..." placeholderTextColor={colors.mutedForeground}
            multiline numberOfLines={4} textAlignVertical="top" />
          <Pressable onPress={handleCreate} disabled={submitting} style={[s.submitBtn, submitting && { opacity: 0.6 }]}>
            {submitting ? <ActivityIndicator color="#fff" /> : (
              <Text style={s.submitText}>Envoyer le ticket</Text>
            )}
          </Pressable>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={i => i.id}
          contentContainerStyle={[s.list, isWeb && { paddingBottom: 34 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: ticket }) => (
            <View style={s.ticketCard}>
              <View style={s.ticketHeader}>
                <Text style={s.ticketSubject} numberOfLines={1}>{ticket.subject}</Text>
                <View style={[s.statusBadge, { backgroundColor: (STATUS_COLORS[ticket.status] || "#94a3b8") + "22" }]}>
                  <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: STATUS_COLORS[ticket.status] || "#94a3b8" }}>{ticket.status}</Text>
                </View>
              </View>
              <Text style={s.ticketMsg} numberOfLines={2}>{ticket.message || ticket.lastMessage}</Text>
              <Text style={s.ticketDate}>{new Date(ticket.createdAt).toLocaleDateString("fr-FR")}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name="headphones" size={36} color={colors.mutedForeground} />
              <Text style={s.emptyTitle}>Aucun ticket</Text>
              <Text style={s.emptyText}>Appuyez sur + pour ouvrir un ticket de support</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = (c: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: c.card, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 20, color: c.foreground },
  addBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: c.primary + "22", alignItems: "center", justifyContent: "center" },
  form: { marginHorizontal: 20, backgroundColor: c.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: c.border },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: c.mutedForeground, marginBottom: 8 },
  input: { backgroundColor: c.secondary, borderRadius: 10, borderWidth: 1, borderColor: c.border, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 14, color: c.foreground, marginBottom: 14 },
  textarea: { minHeight: 90 },
  submitBtn: { backgroundColor: c.primary, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  submitText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  ticketCard: { backgroundColor: c.card, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: c.border },
  ticketHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  ticketSubject: { fontFamily: "Inter_700Bold", fontSize: 15, color: c.foreground, flex: 1, marginRight: 10 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  ticketMsg: { fontFamily: "Inter_400Regular", fontSize: 13, color: c.mutedForeground, lineHeight: 18, marginBottom: 8 },
  ticketDate: { fontFamily: "Inter_400Regular", fontSize: 11, color: c.border },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: c.foreground },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: c.mutedForeground, textAlign: "center" },
});
