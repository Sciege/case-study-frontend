import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pathquest_student_id';

/**
 * Persists the studentId locally on the device.
 */
export const saveSession = async (studentId) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, studentId);
  } catch (error) {
    console.error('Failed to save session:', error);
  }
};

/**
 * Retrieves the persisted studentId.
 */
export const getSession = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
};

/**
 * Clears the persisted studentId (Logout).
 */
export const clearSession = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
};
