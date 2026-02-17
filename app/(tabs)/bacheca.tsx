import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, ZoomIn, FadeInDown } from 'react-native-reanimated';
import { useApp, Note, Child } from '@/lib/app-context';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { apiRequest } from '@/lib/query-client';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 52) / 2;

const NOTE_COLORS = ['#FFD3B6', '#C7CEEA', '#A8E6CF', '#FFF5E1', '#FFE8D9', '#D4F5E5', '#E3E7F5', '#E0BBE4'];

interface CommentData {
  id: string;
  noteId: string;
  userId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

interface NoteCardProps {
  note: Note;
  onPress: (note: Note) => void;
  onDelete: (id: string) => void;
}

function NoteCard({ note, onPress, onDelete }: NoteCardProps) {
  const { t } = useI18n();
  const rotation = parseFloat(note.rotation) || 0;

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      t('deleteNote'),
      t('deleteNoteConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => onDelete(note.id) },
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
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress(note);
        }}
        onLongPress={handleLongPress}
        style={({ pressed }) => [
          styles.noteCard,
          {
            backgroundColor: note.color,
            transform: [
              { rotate: `${rotation}deg` },
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

interface ChildTagProps {
  child: Child;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

function ChildTag({ child, isSelected, onToggle }: ChildTagProps) {
  const tagColor = child.cardColor || '#A8E6CF';
  return (
    <Pressable
      onPress={() => onToggle(child.id)}
      style={[
        styles.childTag,
        { backgroundColor: isSelected ? tagColor : Colors.creamBeige },
        isSelected && { borderColor: tagColor, borderWidth: 2 },
      ]}
    >
      <Text style={[styles.childTagText, isSelected && { color: Colors.textPrimary, fontFamily: 'Nunito_700Bold' }]}>
        {child.name}
      </Text>
      {isSelected && <Ionicons name="checkmark-circle" size={16} color={Colors.textPrimary} />}
    </Pressable>
  );
}

interface CommentBubbleProps {
  comment: CommentData;
  isMine: boolean;
  index: number;
}

function CommentBubble({ comment, isMine, index }: CommentBubbleProps) {
  const formattedTime = new Date(comment.createdAt).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(200)}>
      <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
        <View style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleOther,
        ]}>
          {!isMine && (
            <Text style={styles.bubbleAuthor}>{comment.authorName}</Text>
          )}
          <Text style={styles.bubbleText}>{comment.text}</Text>
          <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>{formattedTime}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function BachecaScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const { notes, children, addNote, updateNote, removeNote } = useApp();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editText, setEditText] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [addTags, setAddTags] = useState<string[]>([]);
  const [commentsList, setCommentsList] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const loadComments = useCallback(async (noteId: string) => {
    setLoadingComments(true);
    try {
      const res = await apiRequest('GET', `/api/notes/${noteId}/comments`);
      const data = await res.json();
      setCommentsList(data);
    } catch {
      setCommentsList([]);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedNote) return;
    setSendingComment(true);
    try {
      const res = await apiRequest('POST', `/api/notes/${selectedNote.id}/comments`, { text: newComment.trim() });
      const comment = await res.json();
      setCommentsList(prev => [...prev, comment]);
      setNewComment('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setSendingComment(false);
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    const tagsStr = addTags.length > 0 ? JSON.stringify(addTags) : undefined;
    await addNote(noteText.trim(), user?.name || 'Genitore', tagsStr);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNoteText('');
    setAddTags([]);
    setShowAddModal(false);
  };

  const openDetail = (note: Note) => {
    setSelectedNote(note);
    setEditText(note.text);
    setNewComment('');
    setCommentsList([]);
    try {
      setEditTags(note.tags ? JSON.parse(note.tags) : []);
    } catch {
      setEditTags([]);
    }
    setShowDetailModal(true);
    loadComments(note.id);
  };

  const handleSaveEdit = async () => {
    if (!selectedNote || !editText.trim()) return;
    const tagsStr = editTags.length > 0 ? JSON.stringify(editTags) : undefined;
    await updateNote(selectedNote.id, { text: editText.trim(), tags: tagsStr });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowDetailModal(false);
  };

  const toggleTag = (id: string, isAdd: boolean) => {
    if (isAdd) {
      setAddTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
    } else {
      setEditTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
    }
  };

  const getTaggedChildNames = (note: Note): string[] => {
    if (!note.tags) return [];
    try {
      const tagIds: string[] = JSON.parse(note.tags);
      return tagIds
        .map(id => children.find(c => c.id === id)?.name)
        .filter(Boolean) as string[];
    } catch { return []; }
  };

  const leftColumn = notes.filter((_, i) => i % 2 === 0);
  const rightColumn = notes.filter((_, i) => i % 2 === 1);

  return (
    <View style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr' }]}>
      <LinearGradient
        colors={[Colors.creamBeige, Colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: topPadding + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{t('bacheca_title')}</Text>
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
                <NoteCard key={note.id} note={note} onPress={openDetail} onDelete={removeNote} />
              ))}
            </View>
            <View style={styles.column}>
              {rightColumn.map(note => (
                <NoteCard key={note.id} note={note} onPress={openDetail} onDelete={removeNote} />
              ))}
            </View>
          </View>
        )}

        <View style={{ height: Platform.OS === 'web' ? 34 : 100 }} />
      </ScrollView>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setNoteText('');
          setAddTags([]);
          setShowAddModal(true);
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

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismiss} onPress={() => setShowAddModal(false)} />
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('writeNote')}</Text>
            <TextInput
              style={styles.noteInput}
              placeholder={t('writeNote')}
              placeholderTextColor={Colors.textMuted}
              multiline
              value={noteText}
              onChangeText={setNoteText}
              autoFocus
              maxLength={500}
            />

            {children.length > 0 && (
              <>
                <Text style={styles.tagSectionTitle}>{t('tags')}</Text>
                <View style={styles.tagContainer}>
                  {children.map(child => (
                    <ChildTag
                      key={child.id}
                      child={child}
                      isSelected={addTags.includes(child.id)}
                      onToggle={(id) => toggleTag(id, true)}
                    />
                  ))}
                </View>
              </>
            )}

            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowAddModal(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={handleAddNote}
                style={[styles.modalSaveBtn, !noteText.trim() && styles.modalSaveBtnDisabled]}
                disabled={!noteText.trim()}
              >
                <Ionicons name="checkmark" size={22} color={Colors.white} />
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={showDetailModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalDismiss} onPress={() => setShowDetailModal(false)} />
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={[styles.detailContent, { paddingBottom: insets.bottom + 8 }]}
            >
              <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">
                <View style={styles.modalHandle} />

                {selectedNote && (
                  <View
                    style={[
                      styles.detailNotePreview,
                      { backgroundColor: selectedNote.color },
                    ]}
                  >
                    <Text style={styles.detailAuthor}>{selectedNote.author}</Text>
                    <Text style={styles.detailDate}>
                      {new Date(selectedNote.createdAt).toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                    {getTaggedChildNames(selectedNote).length > 0 && (
                      <View style={styles.detailTagsPreview}>
                        {getTaggedChildNames(selectedNote).map((name, i) => (
                          <View key={i} style={styles.detailTagBadge}>
                            <Text style={styles.detailTagBadgeText}>{name}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                <Text style={styles.detailEditLabel}>{t('noteDetail')}</Text>
                <TextInput
                  style={styles.detailTextInput}
                  value={editText}
                  onChangeText={setEditText}
                  multiline
                  maxLength={500}
                />

                {children.length > 0 && (
                  <>
                    <Text style={styles.tagSectionTitle}>{t('tags')}</Text>
                    <View style={styles.tagContainer}>
                      {children.map(child => (
                        <ChildTag
                          key={child.id}
                          child={child}
                          isSelected={editTags.includes(child.id)}
                          onToggle={(id) => toggleTag(id, false)}
                        />
                      ))}
                    </View>
                  </>
                )}

                <Pressable
                  onPress={handleSaveEdit}
                  style={[styles.saveEditBtn, !editText.trim() && { opacity: 0.5 }]}
                  disabled={!editText.trim()}
                >
                  <Ionicons name="save" size={20} color={Colors.white} />
                  <Text style={styles.saveEditText}>{t('save')}</Text>
                </Pressable>

                <View style={styles.commentsSeparator}>
                  <View style={styles.separatorLine} />
                  <Text style={styles.separatorText}>{t('comments')}</Text>
                  <View style={styles.separatorLine} />
                </View>

                {loadingComments ? (
                  <ActivityIndicator size="small" color={Colors.mintGreen} style={{ marginVertical: 16 }} />
                ) : commentsList.length === 0 ? (
                  <View style={styles.noCommentsWrap}>
                    <Ionicons name="chatbubble-outline" size={24} color={Colors.textMuted} />
                    <Text style={styles.noCommentsText}>{t('noComments')}</Text>
                  </View>
                ) : (
                  <View style={styles.commentsListWrap}>
                    {commentsList.map((comment, index) => (
                      <CommentBubble
                        key={comment.id}
                        comment={comment}
                        isMine={comment.userId === user?.id}
                        index={index}
                      />
                    ))}
                  </View>
                )}
              </ScrollView>

              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder={t('writeComment')}
                  placeholderTextColor={Colors.textMuted}
                  maxLength={300}
                  multiline
                />
                <Pressable
                  onPress={handleAddComment}
                  disabled={!newComment.trim() || sendingComment}
                  style={[
                    styles.commentSendBtn,
                    (!newComment.trim() || sendingComment) && { opacity: 0.4 },
                  ]}
                >
                  {sendingComment ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Ionicons name="send" size={18} color={Colors.white} />
                  )}
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  headerTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 28, color: Colors.textPrimary },
  headerSubtitle: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  masonryContainer: { flexDirection: 'row', gap: 12 },
  column: { flex: 1, gap: 12 },
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
  noteText: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: Colors.textPrimary, lineHeight: 20, marginBottom: 12 },
  noteFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteAuthor: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: Colors.textSecondary },
  noteDate: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textMuted },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 8 },
  emptyText: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.textSecondary, marginTop: 12 },
  emptySubtext: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: Colors.textMuted },
  fab: {
    position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.peachPink, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.peachPinkDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.textMuted, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontFamily: 'Nunito_700Bold', fontSize: 20, color: Colors.textPrimary, marginBottom: 16 },
  noteInput: {
    fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.textPrimary,
    backgroundColor: Colors.creamBeige, borderRadius: 16, padding: 16,
    minHeight: 120, textAlignVertical: 'top',
  },
  tagSectionTitle: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.textSecondary,
    marginTop: 16, marginBottom: 8,
  },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  childTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  childTagText: { fontFamily: 'Nunito_500Medium', fontSize: 13, color: Colors.textSecondary },
  modalActions: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16,
  },
  modalCancelBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  modalCancelText: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.textSecondary },
  modalSaveBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.mintGreen, alignItems: 'center', justifyContent: 'center',
  },
  modalSaveBtnDisabled: { opacity: 0.5 },
  detailContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  detailNotePreview: {
    borderRadius: 20, padding: 20, marginBottom: 20,
    transform: [{ rotate: '-1deg' }],
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  detailAuthor: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.textPrimary },
  detailDate: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  detailTagsPreview: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  detailTagBadge: {
    backgroundColor: 'rgba(255,255,255,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  detailTagBadgeText: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: Colors.textPrimary },
  detailEditLabel: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.textSecondary, marginBottom: 8,
  },
  detailTextInput: {
    fontFamily: 'Nunito_400Regular', fontSize: 16, color: Colors.textPrimary,
    backgroundColor: Colors.creamBeige, borderRadius: 16, padding: 16,
    minHeight: 100, textAlignVertical: 'top',
  },
  saveEditBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.mintGreen, paddingVertical: 14, borderRadius: 20,
    marginTop: 16,
  },
  saveEditText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.white },
  commentsSeparator: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 12,
  },
  separatorLine: { flex: 1, height: 1, backgroundColor: Colors.creamBeige },
  separatorText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: Colors.textSecondary },
  noCommentsWrap: { alignItems: 'center', paddingVertical: 16, gap: 6 },
  noCommentsText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: Colors.textMuted },
  commentsListWrap: { gap: 6, marginBottom: 8 },
  bubbleRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: Colors.mintGreenLight,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.skyBlueLight,
    borderBottomLeftRadius: 4,
  },
  bubbleAuthor: {
    fontFamily: 'Nunito_700Bold', fontSize: 11, color: Colors.skyBlueDark, marginBottom: 2,
  },
  bubbleText: { fontFamily: 'Nunito_500Medium', fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  bubbleTime: { fontFamily: 'Nunito_400Regular', fontSize: 10, color: Colors.textMuted, marginTop: 4 },
  bubbleTimeMine: { textAlign: 'right' as const },
  commentInputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingTop: 10,
    borderTopWidth: 1, borderTopColor: Colors.creamBeige,
  },
  commentInput: {
    flex: 1,
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.creamBeige,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 80,
  },
  commentSendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.mintGreen,
    alignItems: 'center', justifyContent: 'center',
  },
});
