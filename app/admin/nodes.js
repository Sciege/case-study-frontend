import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { COLORS, SIZES } from '../../components/Theme';
import { Plus, Trash2, Edit2, X, Save, MapPin, Database } from 'lucide-react-native';
import { getNodes, api } from '../../services/api';
import QRCode from 'react-native-qrcode-svg';
import { QrCode as QrIcon } from 'lucide-react-native';

export default function AdminNodes() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [formData, setFormData] = useState({
    nodeId: '',
    name: '',
    location: '',
    basePoints: '10',
    rules: {} // { previousNodeId: pointDelta }
  });
  const [ruleInput, setRuleInput] = useState({ prevId: '', bonus: '' });
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [activeQrNode, setActiveQrNode] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState(null);

  const fetchNodes = async () => {
    setLoading(true);
    try {
      const res = await getNodes();
      setNodes(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch nodes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  const handleSave = async () => {
    if (!formData.nodeId || !formData.name) {
      Alert.alert('Error', 'Please fill in all fields (Node ID and Name are required)');
      return;
    }

    try {
      const payload = {
        ...formData,
        basePoints: parseInt(formData.basePoints || '0')
      };

      if (editingNode) {
        await api.put(`/nodes/${editingNode._id}`, payload);
      } else {
        await api.post('/nodes', payload);
      }
      setModalVisible(false);
      setEditingNode(null);
      setFormData({ nodeId: '', name: '', location: '', basePoints: '10', rules: {} });
      setRuleInput({ prevId: '', bonus: '' });
      fetchNodes();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.message || 'Failed to save node';
      Alert.alert('Error', msg);
    }
  };

  const handleDelete = (node) => {
    setNodeToDelete(node);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/nodes/${nodeToDelete._id}`);
      setDeleteModalVisible(false);
      fetchNodes();
      alert('Node deleted successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to delete node');
    }
  };

  const openEdit = (node) => {
    setEditingNode(node);
    setFormData({
      nodeId: node.nodeId,
      name: node.name,
      location: node.location || '',
      basePoints: node.basePoints.toString(),
      rules: node.rules || {}
    });
    setModalVisible(true);
  };

  const addRule = () => {
    if (!ruleInput.prevId || !ruleInput.bonus) {
      Alert.alert('Error', 'Please enter both Node ID and Bonus points');
      return;
    }
    const bonusVal = parseInt(ruleInput.bonus);
    if (isNaN(bonusVal)) {
      Alert.alert('Error', 'Bonus points must be a number');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      rules: { ...prev.rules, [ruleInput.prevId]: bonusVal }
    }));
    setRuleInput({ prevId: '', bonus: '' });
  };

  const removeRule = (id) => {
    const nextRules = { ...formData.rules };
    delete nextRules[id];
    setFormData({ ...formData, rules: nextRules });
  };

  const showQr = (node) => {
    setActiveQrNode(node);
    setQrModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Manage Nodes', headerRight: () => (
        <TouchableOpacity onPress={() => { setEditingNode(null); setModalVisible(true); }}>
          <Plus color={COLORS.white} size={24} />
        </TouchableOpacity>
      )}} />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={nodes}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.nodeCard}>
              <View style={styles.nodeHeader}>
                <View>
                  <Text style={styles.nodeName}>{item.name}</Text>
                  <Text style={styles.nodeId}>ID: {item.nodeId}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.basePoints} pts</Text>
                </View>
              </View>
              <View style={styles.nodeFooter}>
                <View style={styles.locationContainer}>
                  <MapPin size={14} color={COLORS.lightText} />
                  <Text style={styles.locationText}>{item.location || 'No Location'}</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => showQr(item)} style={styles.actionBtn}>
                    <QrIcon size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                    <Edit2 size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                    <Trash2 size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Database size={48} color={COLORS.lightText} />
              <Text style={styles.emptyText}>No nodes created yet.</Text>
              <TouchableOpacity 
                style={styles.createFirstBtn} 
                onPress={() => { setEditingNode(null); setModalVisible(true); }}
              >
                <Text style={styles.createFirstBtnText}>Create Your First Node</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingNode ? 'Edit Node' : 'Add New Node'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.form}>
              <Text style={styles.label}>Node ID (for QR Code)</Text>
              <TextInput 
                style={styles.input} 
                value={formData.nodeId} 
                onChangeText={(t) => setFormData({...formData, nodeId: t})}
                placeholder="e.g. library_01"
                placeholderTextColor={COLORS.lightText}
              />

              <Text style={styles.label}>Name</Text>
              <TextInput 
                style={styles.input} 
                value={formData.name} 
                onChangeText={(t) => setFormData({...formData, name: t})}
                placeholder="e.g. University Library"
                placeholderTextColor={COLORS.lightText}
              />

              <Text style={styles.label}>Location</Text>
              <TextInput 
                style={styles.input} 
                value={formData.location} 
                onChangeText={(t) => setFormData({...formData, location: t})}
                placeholder="e.g. North Campus, 2F"
                placeholderTextColor={COLORS.lightText}
              />

              <Text style={styles.label}>Base Points</Text>
              <TextInput 
                style={styles.input} 
                value={formData.basePoints} 
                onChangeText={(t) => setFormData({...formData, basePoints: t})}
                keyboardType="numeric"
                placeholderTextColor={COLORS.lightText}
              />

              <View style={styles.divider} />
              
              <Text style={styles.sectionLabel}>Sequence Rules (Bonuses)</Text>
              <Text style={styles.hint}>Give extra points if scanned after a specific node.</Text>
              
              <View style={styles.ruleInputRow}>
                <TextInput 
                  style={[styles.input, { flex: 2, marginBottom: 0 }]} 
                  placeholder="Prev Node ID"
                  placeholderTextColor={COLORS.lightText}
                  value={ruleInput.prevId}
                  onChangeText={(t) => setRuleInput({...ruleInput, prevId: t})}
                />
                <TextInput 
                  style={[styles.input, { flex: 1, marginHorizontal: 8, marginBottom: 0 }]} 
                  placeholder="+ Pts"
                  placeholderTextColor={COLORS.lightText}
                  value={ruleInput.bonus}
                  onChangeText={(t) => setRuleInput({...ruleInput, bonus: t})}
                  keyboardType="numeric"
                />
                <TouchableOpacity 
                  style={styles.addRuleBtn} 
                  onPress={addRule}
                  activeOpacity={0.7}
                >
                  <Plus color={COLORS.white} size={20} />
                </TouchableOpacity>
              </View>

              {Object.entries(formData.rules).map(([id, bonus]) => (
                <View key={id} style={styles.ruleItem}>
                  <Text style={styles.ruleText}>After <Text style={{fontWeight:'bold'}}>{id}</Text>: <Text style={{color:COLORS.primary}}>+{bonus} pts</Text></Text>
                  <TouchableOpacity onPress={() => removeRule(id)}>
                    <X size={16} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Save color={COLORS.white} size={20} style={{marginRight: 8}} />
                <Text style={styles.saveBtnText}>{editingNode ? 'Update Node' : 'Create Node'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={qrModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Node QR Code</Text>
              <TouchableOpacity onPress={() => setQrModalVisible(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.qrContainer}>
              <Text style={styles.qrNodeName}>{activeQrNode?.name}</Text>
              <Text style={styles.qrNodeId}>ID: {activeQrNode?.nodeId}</Text>
              
              <View style={styles.qrWrapper}>
                <QRCode
                  value={activeQrNode?.nodeId || 'placeholder'}
                  size={200}
                  color={COLORS.primary}
                  backgroundColor={COLORS.white}
                />
              </View>
              
              <Text style={styles.qrHint}>Screenshot and print this code for the campus players!</Text>
            </View>
            
            <TouchableOpacity style={styles.closeBtn} onPress={() => setQrModalVisible(false)}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Delete Confirmation Modal */}
      <Modal visible={deleteModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={styles.iconCircleWarning}>
                <Trash2 size={32} color={COLORS.error} />
            </View>
            <Text style={styles.confirmTitle}>Delete Node?</Text>
            <Text style={styles.confirmText}>Are you sure you want to delete <Text style={{fontWeight:'bold'}}>{nodeToDelete?.name}</Text>? All associated points and rules will be removed.</Text>
            
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => { setEditingNode(null); setModalVisible(true); }}
      >
        <Plus color={COLORS.white} size={30} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.padding / 2,
  },
  nodeCard: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: SIZES.borderRadius,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 2,
  },
  nodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  nodeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  nodeId: {
    fontSize: 12,
    color: COLORS.lightText,
  },
  badge: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  nodeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f9f9f9',
    paddingTop: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: COLORS.lightText,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    marginLeft: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: COLORS.glass,
    borderRadius: 24,
    padding: SIZES.padding,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    ...(Platform.OS === 'web' && { backdropFilter: 'blur(10px)' }),
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
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: COLORS.lightText,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: SIZES.borderRadius,
    marginBottom: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    height: 50,
    borderRadius: SIZES.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: COLORS.lightText,
    marginTop: 10,
    fontStyle: 'italic',
  },
  createFirstBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  createFirstBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  hint: {
    fontSize: 12,
    color: COLORS.lightText,
    marginBottom: 12,
  },
  ruleInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  addRuleBtn: {
    backgroundColor: COLORS.secondary,
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ruleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  ruleText: {
    fontSize: 14,
    color: COLORS.text,
  },
  qrModalContent: {
    backgroundColor: COLORS.glass,
    borderRadius: 24,
    padding: SIZES.padding,
    width: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    ...(Platform.OS === 'web' && { backdropFilter: 'blur(10px)' }),
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  qrNodeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  qrNodeId: {
    fontSize: 14,
    color: COLORS.lightText,
    marginBottom: 20,
  },
  qrWrapper: {
    padding: 15,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  qrHint: {
    marginTop: 20,
    fontSize: 13,
    color: COLORS.lightText,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  closeBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  closeBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  confirmModalContent: {
    width: '85%',
    backgroundColor: COLORS.glass,
    borderRadius: 28,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
    ...(Platform.OS === 'web' && { backdropFilter: 'blur(20px)' }),
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 15,
    marginBottom: 10,
  },
  confirmText: {
    fontSize: 14,
    color: COLORS.lightText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 25,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cancelBtnText: {
    color: COLORS.lightText,
    fontWeight: 'bold',
  },
  deleteBtn: {
    flex: 2,
    height: 50,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  iconCircleWarning: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
