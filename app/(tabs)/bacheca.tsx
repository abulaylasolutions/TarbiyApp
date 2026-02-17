import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { useApp } from '@/lib/app-context';
import { useAuth } from '@/lib/auth-context';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 52) / 2;

interface NoteCardProps {
  note: {
    id: string;
    text: string;
    color: string;
    rotation: number;
    createdAt: string;
    author: string;
  };
  onDelete: (id: string) => void;
}

function NoteCard({ note, onDelete }: NoteCardProps) {
  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Elimina nota',
      'Vuoi eliminare questa nota?',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', style: 'destructive', onPress: () => onDelete(note.id) },
      ]
    );
  };

  const formattedDate = new Date(note.createdAt).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <Animated.View entering={ZoomIn.duration(300)} style={{ width: CARD_WIDTH }}>
      <Pressable
        onLongPress={handleLongPress}
        style={({ pressed }) => [
          styles.noteCard,
          {
            backgroundColor: note.color,
            transform: [
              { rotate: `${note.rotation}deg` },
              { scale: pressed ? 0.96 : 1 },
            ],
          },
        ]}
      >
        <Text style={styles.noteText} numberOfLines={6}>
          {note.text}
        </Text>
        <View style={styles.noteFooter}>
          <Text style={styles.noteAuthor}>{note.author}</Text>
          <Text style={styles.noteDate}>{formattedDate}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function BachecaScreen() {
  const insets = useSafeAreaInsets();
  const { notes, addNote, removeNote } = useApp();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [noteText, setNoteText] = useState('');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    await addNote(noteText.trim(), user?.name || 'Genitore');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNoteText('');
    setShowModal(false);
  };

  const leftColumn = notes.filter((_, i) => i % 2 === 0);
  const rightColumn = notes.filter((_, i) => i % 2 === 1);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.creamBeige, Colors.background] as const}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: topPadding + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Bacheca</Text>
            <Text style={styles.headerSubtitle}>Note condivise tra genitori</Text>
          </View>
        </View>

        {notes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Nessuna nota</Text>
            <Text style={styles.emptySubtext}>Aggiungi una nota per condividerla</Text>
          </View>
        ) : (
          <View style={styles.masonryContainer}>
            <View style={styles.column}>
              {leftColumn.map(note => (
                <NoteCard key={note.id} note={note} onDelete={removeNote} />
              ))}
            </View>
            <View style={styles.column}>
              {rightColumn.map(note => (
                <NoteCard key={note.id} note={note} onDelete={removeNote} />
              ))}
            </View>
          </View>
        )}

        <View style={{ height: Platform.OS === 'web' ? 34 : 100 }} />
      </ScrollView>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowModal(true);
        }}
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: Platform.OS === 'web' ? 34 + 24 : insets.bottom + 80,
            transform: [{ scale: pressed ? 0.9 : 1 }],
          },
        ]}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </Pressable>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismiss} onPress={() => setShowModal(false)} />
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Nuova nota</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Scrivi una nota..."
              placeholderTextColor={Colors.textMuted}
              multiline
              value={noteText}
              onChangeText={setNoteText}
              autoFocus
              maxLength={300}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowModal(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Annulla</Text>
              </Pressable>
              <Pressable
                onPress={handleAddNote}
                style={[
                  styles.modalSaveBtn,
                  !noteText.trim() && styles.modalSaveBtnDisabled,
                ]}
                disabled={!noteText.trim()}
              >
                <Ionicons name="checkmark" size={22} color={Colors.white} />
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  masonryContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
    gap: 12,
  },
  noteCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  noteText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteAuthor: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    color: Colors.textSecondary,
  },
  noteDate: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.peachPink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.peachPinkDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  noteInput: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.creamBeige,
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  modalCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalCancelText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalSaveBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.mintGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtnDisabled: {
    opacity: 0.5,
  },
});
