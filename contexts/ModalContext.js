import React, { createContext, useContext, useState } from 'react';
import { Portal } from 'react-native-portalize';
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

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      
      <Portal>
        <ConfirmationDialog
          visible={modal.visible}
          title={modal.title}
          message={modal.message}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
          cancelText={modal.cancelText}
          confirmText={modal.confirmText}
          confirmButtonColor={modal.confirmButtonColor}
          confirmTextColor={modal.confirmTextColor}
          icon={modal.icon}
          iconColor={modal.iconColor}
          destructive={modal.destructive}
        />
      </Portal>
    </ModalContext.Provider>
  );
}; 