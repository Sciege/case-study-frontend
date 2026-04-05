import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { COLORS, SIZES } from '../../components/Theme';
import { Trash2, Edit2, X, Save, User, Search, RefreshCw } from 'lucide-react-native';
import { getUsers, updateUserScore, deleteUser } from '../../services/api';

export default function AdminPlayers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newScore, setNewScore] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch players');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateScore = async () => {
    if (!newScore || isNaN(newScore)) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }

    try {
      await updateUserScore(editingUser.studentId, parseInt(newScore));
      setModalVisible(false);
      fetchUsers();
    } catch (err) {
      Alert.alert('Error', 'Failed to update score');
    }
  };

  const handleDeleteUser = (studentId) => {
    Alert.alert('Delete Player', `Remove student ${studentId} permanently?`, [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteUser(studentId);
          fetchUsers();
        } catch (err) {
          Alert.alert('Error', 'Failed to delete');
        }
      }}
    ]);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setNewScore(user.totalScore.toString());
    setModalVisible(true);
  };

  const filteredUsers = users.filter(u => 
    u.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Manage Players' }} />

      <View style={styles.searchBar}>
        <Search size={20} color={COLORS.lightText} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search Student ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity onPress={fetchUsers}>
          <RefreshCw size={20} color={COLORS.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.studentId}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={styles.userInfo}>
                <View style={styles.userIcon}>
                  <User color={COLORS.primary} size={24} />
                </View>
                <View>
                  <Text style={styles.studentId}>{item.studentId}</Text>
                  <Text style={styles.scanCount}>{item.scanHistory?.length || 0} scans performed</Text>
                </View>
              </View>
              
              <View style={styles.userScoreAction}>
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreValue}>{item.totalScore}</Text>
                  <Text style={styles.scoreLabel}>PTS</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                    <Edit2 size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteUser(item.studentId)} style={styles.actionBtn}>
                    <Trash2 size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No players found.</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Player Score</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.editForm}>
              <Text style={styles.label}>Editing {editingUser?.studentId}</Text>
              <TextInput 
                style={styles.input} 
                value={newScore} 
                onChangeText={setNewScore}
                keyboardType="numeric"
                autoFocus
                placeholder="Enter new total points"
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateScore}>
                <Save color={COLORS.white} size={20} style={{marginRight: 8}} />
                <Text style={styles.saveBtnText}>Update Points</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    margin: SIZES.padding / 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  userCard: {
    backgroundColor: COLORS.white,
    padding: 15,
    marginHorizontal: SIZES.padding / 2,
    marginBottom: 8,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  scanCount: {
    fontSize: 12,
    color: COLORS.lightText,
  },
  userScoreAction: {
    alignItems: 'flex-end',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  scoreLabel: {
    fontSize: 10,
    color: COLORS.lightText,
    marginTop: -4,
  },
  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    marginLeft: 15,
  },
  emptyText: {
    color: COLORS.lightText,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SIZES.padding,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  label: {
    fontSize: 14,
    color: COLORS.lightText,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.primary,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  }
});
