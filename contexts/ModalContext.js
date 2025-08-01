import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import ConfirmationDialog from '../components/ConfirmationDialog';

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};



export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState({
    visible: false,
    title: '',
    message: '',
    onCancel: null,
    onConfirm: null,
    cancelText: 'Cancel',
    confirmText: 'Confirm',
    confirmButtonColor: '#f1ca3b',
    confirmTextColor: 'white',
    icon: 'alert-circle',
    iconColor: '#f1ca3b',
    destructive: false
  });

  const showModal = (modalConfig) => {
    setModal({
      visible: true,
      ...modalConfig
    });
  };

  const hideModal = () => {
    setModal(prev => ({ ...prev, visible: false }));
  };

  const handleCancel = () => {
    if (modal.onCancel) {
      modal.onCancel();
    }
    hideModal();
  };

  const handleConfirm = () => {
    if (modal.onConfirm) {
      modal.onConfirm();
    }
    hideModal();
  };

  // For web, render the modal at the document body level
  useEffect(() => {
    if (Platform.OS === 'web' && modal.visible) {
      const modalElement = document.createElement('div');
      modalElement.id = 'global-modal-container';
      modalElement.style.position = 'fixed';
      modalElement.style.top = '0';
      modalElement.style.left = '0';
      modalElement.style.right = '0';
      modalElement.style.bottom = '0';
      modalElement.style.zIndex = '999999';
      modalElement.style.pointerEvents = 'auto';
      document.body.appendChild(modalElement);

      return () => {
        const existingModal = document.getElementById('global-modal-container');
        if (existingModal) {
          document.body.removeChild(existingModal);
        }
      };
    }
  }, [modal.visible]);

  return (
    <ModalContext.Provider value={{ showModal, hideModal, modal }}>
      {children}
    </ModalContext.Provider>
  );
}; 