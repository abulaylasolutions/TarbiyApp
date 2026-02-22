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
import { useRouter } from 'expo-router';
import { useApp, Note, Child } from '@/lib/app-context';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { apiRequest } from '@/lib/query-client';
import Colors from '@/constants/colors';
import { useTheme, getGenderColor } from '@/lib/theme-context';
import PremiumOverlay from '@/components/PremiumOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 52) / 2;

const NOTE_COLORS = ['#FFD3B6', '#C7CEEA', '#A8E6CF', '#C8F0E3', '#FFE8D9', '#D4F5E5', '#E3E7F5', '#E0BBE4'];

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
  onArchive: (id: string) => void;
  onEdit: (note: Note) => void;
}

function NoteCard({ note, onPress, onDelete, onArchive, onEdit }: NoteCardProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [showActions, setShowActions] = useState(false);
  const rotation = parseFloat(note.rotation) || 0;

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowActions(true);
  };

  const formattedDate = new Date(note.createdAt).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
  });
  const formattedTime = new Date(note.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
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
            <Text style={styles.noteDate}>{formattedDate} {formattedTime}</Text>
          </View>
        </Pressable>
      </Animated.View>

      <Modal visible={showActions} transparent animationType="fade">
        <Pressable style={[styles.actionSheetOverlay, { backgroundColor: colors.modalOverlay }]} onPress={() => setShowActions(false)}>
          <Animated.View entering={FadeInDown.duration(200)} style={[styles.actionSheet, { backgroundColor: colors.modalBackground }]}>
            <View style={[styles.actionSheetHandle, { backgroundColor: colors.textMuted }]} />
            <Pressable
              onPress={() => { setShowActions(false); onEdit(note); }}
              style={[styles.actionSheetItem, { borderBottomColor: colors.border }]}
            >
              <View style={[styles.actionSheetIcon, { backgroundColor: colors.mintGreenLight }]}>
                <Ionicons name="create-outline" size={20} color={colors.mintGreenDark} />
              </View>
              <Text style={[styles.actionSheetText, { color: colors.textPrimary }]}>{t('editNote')}</Text>
            </Pressable>
            <Pressable
              onPress={() => { setShowActions(false); onArchive(note.id); }}
              style={[styles.actionSheetItem, { borderBottomColor: colors.border }]}
            >
              <View style={[styles.actionSheetIcon, { backgroundColor: colors.mintGreenLight }]}>
                <Ionicons name="archive-outline" size={20} color={colors.mintGreenDark} />
              </View>
              <Text style={[styles.actionSheetText, { color: colors.textPrimary }]}>{t('archive')}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setShowActions(false);
                Alert.alert(
                  t('deleteNote'),
                  t('deleteNoteConfirm'),
                  [
                    { text: t('cancel'), style: 'cancel' },
                    { text: t('delete'), style: 'destructive', onPress: () => onDelete(note.id) },
                  ]
                );
              }}
              style={[styles.actionSheetItem, { borderBottomWidth: 0 }]}
            >
              <View style={[styles.actionSheetIcon, { backgroundColor: colors.dangerLight }]}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </View>
              <Text style={[styles.actionSheetText, { color: colors.danger }]}>{t('delete')}</Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

interface ChildTagProps {
  child: Child;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

function ChildTag({ child, isSelected, onToggle }: ChildTagProps) {
  const { colors, isDark } = useTheme();
  const tagColor = getGenderColor(child.gender);
  return (
    <Pressable
      onPress={() => onToggle(child.id)}
      style={[
        styles.childTag,
        { backgroundColor: isSelected ? tagColor : colors.creamBeige },
        isSelected && { borderColor: tagColor, borderWidth: 2 },
      ]}
    >
      <Text style={[styles.childTagText, { color: colors.textSecondary }, isSelected && { color: colors.textPrimary, fontFamily: 'Nunito_700Bold' }]}>
        {child.name}
      </Text>
      {isSelected && <Ionicons name="checkmark-circle" size={16} color={colors.textPrimary} />}
    </Pressable>
  );
}

interface CommentBubbleProps {
  comment: CommentData;
  isMine: boolean;
  index: number;
}

function CommentBubble({ comment, isMine, index }: CommentBubbleProps) {
  const { colors } = useTheme();
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
          isMine ? [styles.bubbleMine, { backgroundColor: colors.mintGreenLight }] : styles.bubbleOther,
        ]}>
          {!isMine && (
            <Text style={styles.bubbleAuthor}>{comment.authorName}</Text>
          )}
          <Text style={[styles.bubbleText, { color: colors.textPrimary }]}>{comment.text}</Text>
          <Text style={[styles.bubbleTime, { color: colors.textMuted }, isMine && styles.bubbleTimeMine]}>{formattedTime}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function BachecaScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const { colors, isDark } = useTheme();
  const { notes, children, addNote, updateNote, removeNote, refreshNotes } = useApp();
  const { user } = useAuth();
  const isPremium = user?.isPremium;
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [archivedNotes, setArchivedNotes] = useState<Note[]>([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editText, setEditText] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [addTags, setAddTags] = useState<string[]>([]);
  const [commentsList, setCommentsList] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const [editColor, setEditColor] = useState(NOTE_COLORS[0]);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; noteId: string; message: string } | null>(null);
  const snackbarTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const loadArchivedNotes = useCallback(async () => {
    setLoadingArchive(true);
    try {
      const res = await apiRequest('GET', '/api/notes?archived=true');
      const data = await res.json();
      setArchivedNotes(data);
    } catch {
      setArchivedNotes([]);
    } finally {
      setLoadingArchive(false);
    }
  }, []);

  const showSnackbar = (noteId: string, message: string) => {
    if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
    setSnackbar({ visible: true, noteId, message });
    snackbarTimeout.current = setTimeout(() => {
      setSnackbar(null);
    }, 4000);
  };

  const archiveNote = async (noteId: string) => {
    console.log("Archiviando nota", noteId);
    try {
      const res = await apiRequest('POST', `/api/notes/${noteId}/archive`);
      const data = await res.json();
      console.log("Risposta archivio:", data);
      await refreshNotes();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSnackbar(noteId, t('noteArchived'));
    } catch (err) {
      console.error("Errore archiviazione nota:", err);
    }
  };

  const handleUndoArchive = async (noteId: string) => {
    if (snackbarTimeout.current) clearTimeout(snackbarTimeout.current);
    setSnackbar(null);
    try {
      await apiRequest('POST', `/api/notes/${noteId}/archive`, { archived: false });
      await refreshNotes();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const unarchiveNote = async (noteId: string) => {
    try {
      await apiRequest('POST', `/api/notes/${noteId}/archive`, { archived: false });
      await refreshNotes();
      await loadArchivedNotes();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

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
    await addNote(noteText.trim(), user?.name || 'Genitore', tagsStr, selectedColor);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNoteText('');
    setAddTags([]);
    setSelectedColor(NOTE_COLORS[0]);
    setShowAddModal(false);
  };

  const openDetail = (note: Note) => {
    setSelectedNote(note);
    setEditText(note.text);
    setEditColor(note.color || NOTE_COLORS[0]);
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
    await updateNote(selectedNote.id, { text: editText.trim(), tags: tagsStr, color: editColor });
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
    <View style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr', backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.creamBeige, colors.background]}
        style={StyleSheet.absoluteFill}
      />

      {!isPremium && (
        <PremiumOverlay
          message={t('premiumBlockBacheca')}
          icon="newspaper"
          onDiscover={() => router.push('/(tabs)/settings')}
        />
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: topPadding + 16 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!isPremium}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('bacheca_title')}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Note condivise tra genitori</Text>
          </View>
          {isPremium && (
          <Pressable
            onPress={() => {
              loadArchivedNotes();
              setShowArchive(true);
            }}
            style={[styles.archiveBtn, { backgroundColor: colors.creamBeige }]}
          >
            <Ionicons name="archive-outline" size={20} color={colors.textSecondary} />
          </Pressable>
          )}
        </View>

        {notes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nessuna nota</Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Aggiungi una nota per condividerla</Text>
          </View>
        ) : (
          <View style={styles.masonryContainer}>
            <View style={styles.column}>
              {leftColumn.map(note => (
                <NoteCard key={note.id} note={note} onPress={openDetail} onDelete={removeNote} onArchive={archiveNote} onEdit={openDetail} />
              ))}
            </View>
            <View style={styles.column}>
              {rightColumn.map(note => (
                <NoteCard key={note.id} note={note} onPress={openDetail} onDelete={removeNote} onArchive={archiveNote} onEdit={openDetail} />
              ))}
            </View>
          </View>
        )}

        <View style={{ height: Platform.OS === 'web' ? 34 : 100 }} />
      </ScrollView>

      {isPremium && (
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
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>
      )}

      {snackbar?.visible && (
        <Animated.View
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(200)}
          style={[styles.snackbar, { bottom: Platform.OS === 'web' ? 34 + 16 : insets.bottom + 72 }]}
        >
          <Ionicons name="archive" size={18} color={colors.white} />
          <Text style={styles.snackbarText}>{snackbar.message}</Text>
          <Pressable onPress={() => handleUndoArchive(snackbar.noteId)} style={styles.snackbarUndo}>
            <Text style={[styles.snackbarUndoText, { color: colors.mintGreenLight }]}>{t('undo')}</Text>
          </Pressable>
        </Animated.View>
      )}

      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
            <Pressable style={styles.modalDismiss} onPress={() => setShowAddModal(false)} />
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={[styles.modalContent, { paddingBottom: insets.bottom + 16, backgroundColor: colors.modalBackground }]}
            >
              <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">
                <View style={[styles.modalHandle, { backgroundColor: colors.textMuted }]} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('writeNote')}</Text>
                <TextInput
                  style={[styles.noteInput, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                  placeholder={t('writeNote')}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  value={noteText}
                  onChangeText={setNoteText}
                  autoFocus
                  maxLength={500}
                />

                {children.length > 0 && (
                  <>
                    <Text style={[styles.tagSectionTitle, { color: colors.textSecondary }]}>{t('tags')}</Text>
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

                <Text style={[styles.tagSectionTitle, { color: colors.textSecondary }]}>{t('noteColor')}</Text>
                <View style={styles.colorPickerRow}>
                  {NOTE_COLORS.map(color => (
                    <Pressable
                      key={color}
                      onPress={() => setSelectedColor(color)}
                      style={[
                        styles.colorDot,
                        { backgroundColor: color },
                        selectedColor === color && styles.colorDotActive,
                      ]}
                    >
                      {selectedColor === color && (
                        <Ionicons name="checkmark" size={14} color="rgba(0,0,0,0.5)" />
                      )}
                    </Pressable>
                  ))}
                </View>

                <View style={styles.modalActions}>
                  <Pressable onPress={() => setShowAddModal(false)} style={styles.modalCancelBtn}>
                    <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleAddNote}
                    style={[styles.modalSaveBtn, { backgroundColor: colors.mintGreen }, !noteText.trim() && styles.modalSaveBtnDisabled]}
                    disabled={!noteText.trim()}
                  >
                    <Ionicons name="checkmark" size={22} color={colors.white} />
                  </Pressable>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showDetailModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
            <Pressable style={styles.modalDismiss} onPress={() => setShowDetailModal(false)} />
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={[styles.detailContent, { paddingBottom: insets.bottom + 8, backgroundColor: colors.modalBackground }]}
            >
              <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">
                <View style={[styles.modalHandle, { backgroundColor: colors.textMuted }]} />

                {selectedNote && (
                  <View
                    style={[
                      styles.detailNotePreview,
                      { backgroundColor: selectedNote.color },
                    ]}
                  >
                    <Text style={[styles.detailAuthor, { color: colors.textPrimary }]}>{selectedNote.author}</Text>
                    <Text style={[styles.detailDate, { color: colors.textSecondary }]}>
                      {new Date(selectedNote.createdAt).toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })} {new Date(selectedNote.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

                <Text style={[styles.detailEditLabel, { color: colors.textSecondary }]}>{t('noteDetail')}</Text>
                <TextInput
                  style={[styles.detailTextInput, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                  value={editText}
                  onChangeText={setEditText}
                  multiline
                  maxLength={500}
                />

                {children.length > 0 && (
                  <>
                    <Text style={[styles.tagSectionTitle, { color: colors.textSecondary }]}>{t('tags')}</Text>
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

                <Text style={[styles.tagSectionTitle, { color: colors.textSecondary }]}>{t('noteColor')}</Text>
                <View style={styles.colorPickerRow}>
                  {NOTE_COLORS.map(color => (
                    <Pressable
                      key={color}
                      onPress={() => setEditColor(color)}
                      style={[
                        styles.colorDot,
                        { backgroundColor: color },
                        editColor === color && styles.colorDotActive,
                      ]}
                    >
                      {editColor === color && (
                        <Ionicons name="checkmark" size={14} color="rgba(0,0,0,0.5)" />
                      )}
                    </Pressable>
                  ))}
                </View>

                <View style={styles.detailActionsRow}>
                  <Pressable
                    onPress={handleSaveEdit}
                    style={[styles.saveEditBtn, { flex: 1, backgroundColor: colors.mintGreen }, !editText.trim() && { opacity: 0.5 }]}
                    disabled={!editText.trim()}
                  >
                    <Ionicons name="save" size={20} color={colors.white} />
                    <Text style={[styles.saveEditText, { color: colors.white }]}>{t('save')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      if (selectedNote) {
                        archiveNote(selectedNote.id);
                        setShowDetailModal(false);
                      }
                    }}
                    style={[styles.archiveActionBtn, { backgroundColor: colors.creamBeige }]}
                  >
                    <Ionicons name="archive-outline" size={20} color={colors.textSecondary} />
                  </Pressable>
                </View>

                <View style={styles.commentsSeparator}>
                  <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
                  <Text style={[styles.separatorText, { color: colors.textSecondary }]}>{t('comments')}</Text>
                  <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
                </View>

                {loadingComments ? (
                  <ActivityIndicator size="small" color={colors.mintGreen} style={{ marginVertical: 16 }} />
                ) : commentsList.length === 0 ? (
                  <View style={styles.noCommentsWrap}>
                    <Ionicons name="chatbubble-outline" size={24} color={colors.textMuted} />
                    <Text style={[styles.noCommentsText, { color: colors.textMuted }]}>{t('noComments')}</Text>
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

              <View style={[styles.commentInputRow, { borderTopColor: colors.border }]}>
                <TextInput
                  style={[styles.commentInput, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder={t('writeComment')}
                  placeholderTextColor={colors.textMuted}
                  maxLength={300}
                  multiline
                />
                <Pressable
                  onPress={handleAddComment}
                  disabled={!newComment.trim() || sendingComment}
                  style={[
                    styles.commentSendBtn,
                    { backgroundColor: colors.mintGreen },
                    (!newComment.trim() || sendingComment) && { opacity: 0.4 },
                  ]}
                >
                  {sendingComment ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Ionicons name="send" size={18} color={colors.white} />
                  )}
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showArchive} animationType="slide" transparent={false}>
        <View style={[styles.archiveFullPage, { paddingTop: Platform.OS === 'web' ? 67 : insets.top, backgroundColor: colors.background }]}>
          <View style={styles.archiveAppBar}>
            <Pressable onPress={() => setShowArchive(false)} style={styles.archiveBackBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.archiveAppBarTitle, { color: colors.textPrimary }]}>{t('archivedNotes')}</Text>
            <View style={{ width: 40 }} />
          </View>
          {loadingArchive ? (
            <ActivityIndicator size="large" color={colors.mintGreen} style={{ marginTop: 40 }} />
          ) : archivedNotes.length === 0 ? (
            <View style={styles.archiveEmpty}>
              <Ionicons name="archive-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.archiveEmptyText, { color: colors.textMuted }]}>{t('noArchivedNotes')}</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.archiveList} showsVerticalScrollIndicator={false}>
              {archivedNotes.map((note) => {
                const noteDate = new Date(note.createdAt);
                const dateStr = noteDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
                const timeStr = noteDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <Animated.View key={note.id} entering={FadeInDown.duration(300)}>
                    <View style={[styles.archivedCard, { backgroundColor: note.color }]}>
                      <Text style={styles.archivedCardText} numberOfLines={4}>{note.text}</Text>
                      <View style={styles.archivedCardFooter}>
                        <Text style={styles.archivedCardMeta}>{note.author} - {dateStr} {timeStr}</Text>
                        <Pressable
                          onPress={() => unarchiveNote(note.id)}
                          style={styles.unarchiveBtn}
                        >
                          <Ionicons name="arrow-undo-outline" size={18} color={colors.mintGreen} />
                          <Text style={[styles.unarchiveBtnText, { color: colors.textPrimary }]}>{t('unarchive')}</Text>
                        </Pressable>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
              <View style={{ height: insets.bottom + 24 }} />
            </ScrollView>
          )}
        </View>
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
  archiveBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.creamBeige,
    alignItems: 'center', justifyContent: 'center',
  },
  detailActionsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16,
  },
  archiveActionBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.creamBeige,
    alignItems: 'center', justifyContent: 'center',
  },
  archiveFullPage: {
    flex: 1, backgroundColor: Colors.background,
  },
  archiveAppBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  archiveBackBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  archiveAppBarTitle: {
    fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.textPrimary,
  },
  archiveEmpty: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12,
  },
  archiveEmptyText: {
    fontFamily: 'Nunito_500Medium', fontSize: 16, color: Colors.textMuted,
  },
  archiveList: {
    paddingHorizontal: 16, paddingTop: 8, gap: 12,
  },
  archivedCard: {
    borderRadius: 16, padding: 16,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  archivedCardText: {
    fontFamily: 'Nunito_500Medium', fontSize: 14, color: Colors.textPrimary, lineHeight: 20, marginBottom: 10,
  },
  archivedCardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  archivedCardMeta: {
    fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.textSecondary, flex: 1,
  },
  unarchiveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  unarchiveBtnText: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#000000',
  },
  actionSheetOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8,
  },
  actionSheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.textMuted, alignSelf: 'center', marginBottom: 16,
  },
  actionSheetItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.creamBeige,
  },
  actionSheetIcon: {
    width: 40, height: 40, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  actionSheetText: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.textPrimary,
  },
  colorPickerRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8,
  },
  colorDot: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  colorDotActive: {
    borderColor: 'rgba(0,0,0,0.25)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  snackbar: {
    position: 'absolute', left: 16, right: 16,
    backgroundColor: '#333', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
    zIndex: 999,
  },
  snackbarText: {
    fontFamily: 'Nunito_500Medium', fontSize: 14, color: Colors.white, flex: 1,
  },
  snackbarUndo: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  snackbarUndoText: {
    fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.mintGreenLight,
  },
});
