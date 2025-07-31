import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  TouchableWithoutFeedback 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * A reusable confirmation dialog component for the app
 * 
 * @param {boolean} visible - Whether the dialog is visible
 * @param {string} title - The title of the dialog
 * @param {string} message - The message to display
 * @param {function} onCancel - Function to call when canceled
 * @param {function} onConfirm - Function to call when confirmed
 * @param {string} cancelText - Text for the cancel button (default: "Cancel")
 * @param {string} confirmText - Text for the confirm button (default: "Confirm")
 * @param {string} confirmButtonColor - Color for the confirm button (default: "#f1ca3b")
 * @param {string} confirmTextColor - Color for the confirm button text (default: "white")
 * @param {string} icon - Ionicons name for the icon (default: "alert-circle")
 * @param {string} iconColor - Color for the icon (default: "#f1ca3b")
 */
export default function ConfirmationDialog({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  cancelText = "Cancel",
  confirmText = "Confirm",
  confirmButtonColor = "#f1ca3b",
  confirmTextColor = "white",
  icon = "alert-circle",
  iconColor = "#f1ca3b",
  destructive = false
}) {
  // If destructive, override colors to red
  const finalConfirmColor = destructive ? "#ff4d4d" : confirmButtonColor;
  const finalIconColor = destructive ? "#ff4d4d" : iconColor;
  
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityViewIsModal={true}
      accessibilityLabel="Confirmation Dialog"
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onCancel}>
          <View style={styles.overlayTouchable}>
            <TouchableWithoutFeedback>
              <View style={styles.dialogContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name={icon} size={40} color={finalIconColor} />
              </View>
              
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onCancel}
                  accessibilityRole="button"
                  accessibilityLabel={`Cancel ${title}`}
                >
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: finalConfirmColor }]}
                  onPress={onConfirm}
                  accessibilityRole="button"
                  accessibilityLabel={`Confirm ${title}`}
                >
                  <Text style={[styles.confirmButtonText, { color: confirmTextColor }]}>
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconContainer: {
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontWeight: 'bold',
  },
});