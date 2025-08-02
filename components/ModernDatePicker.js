import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

const ModernDatePicker = ({ 
  visible, 
  onClose, 
  selectedDate, 
  onDateSelect, 
  title = "Select Date",
  placeholder = "Select date"
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    
    // Add empty days for padding
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const isToday = (date) => {
    const today = new Date();
    return isSameDay(date, today);
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateSelect = (date) => {
    onDateSelect(date);
    onClose();
  };

  const changeMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <Animated.View 
          style={[
            styles.container,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  })
                }
              ]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Month Navigation */}
          <View style={styles.monthHeader}>
            <TouchableOpacity 
              onPress={() => changeMonth(-1)} 
              style={styles.monthButton}
            >
              <Ionicons name="chevron-back" size={20} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.monthText}>{getMonthName(currentMonth)}</Text>
            <TouchableOpacity 
              onPress={() => changeMonth(1)} 
              style={styles.monthButton}
            >
              <Ionicons name="chevron-forward" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Week Days */}
          <View style={styles.weekDays}>
            {weekDays.map((day, index) => (
              <Text key={index} style={styles.weekDay}>{day}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendar}>
            {days.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  date && isSameDay(date, selectedDate) && styles.selectedDay,
                  date && isToday(date) && styles.today,
                  !date && styles.emptyDay,
                ]}
                onPress={() => date && handleDateSelect(date)}
                disabled={!date || isPastDate(date)}
              >
                {date && (
                  <Text style={[
                    styles.dayText,
                    isSameDay(date, selectedDate) && styles.selectedDayText,
                    isToday(date) && styles.todayText,
                    isPastDate(date) && styles.pastDayText,
                  ]}>
                    {date.getDate()}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Selected Date Display */}
          {selectedDate && (
            <View style={styles.selectedDateContainer}>
              <Text style={styles.selectedDateLabel}>Selected:</Text>
              <Text style={styles.selectedDateText}>
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: Platform.OS === 'web' ? 400 : screenWidth * 0.9,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  dayButton: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 1,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  selectedDay: {
    backgroundColor: '#3b82f6',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: '600',
  },
  today: {
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  todayText: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  pastDay: {
    backgroundColor: '#f3f4f6',
  },
  pastDayText: {
    color: '#9ca3af',
  },
  emptyDay: {
    backgroundColor: 'transparent',
  },
  selectedDateContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },
  selectedDateLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  selectedDateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
});

export default ModernDatePicker; 