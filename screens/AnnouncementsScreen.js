import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  Animated, 
  Dimensions,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState([]);
  const { isAdmin } = useAuth();
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const headerAnim = useRef(new Animated.Value(-100)).current;
  const fabAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchAnnouncements(); // Initial fetch

    // Start entrance animations
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(fabAnim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        })
      ])
    ]).start();

    // Start pulsing animation for FAB
    const pulseAnimation = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ]).start(pulseAnimation);
    };
    pulseAnimation();

    const channel = supabase
      .channel('public:announcements')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        (payload) => {
          fetchAnnouncements(); // Refresh when a new announcement is added
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'announcements' },
        () => {
          fetchAnnouncements(); // Refresh on delete too
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel); // Clean up on unmount
    };
  }, []);



  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setAnnouncements(data);
    }
  };

  const deleteAnnouncement = async (id) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          const { error } = await supabase.from('announcements').delete().eq('id', id);
          if (error) {
            Alert.alert('Error', error.message);
          } else {
            fetchAnnouncements();
          }
        },
      },
    ]);
  };

  const AnimatedAnnouncementCard = ({ item, index }) => {
    const cardFade = useRef(new Animated.Value(0)).current;
    const cardSlide = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
      // Stagger the animation for each card
      Animated.sequence([
        Animated.delay(index * 100),
        Animated.parallel([
          Animated.timing(cardFade, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(cardSlide, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          })
        ])
      ]).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.announcementCard,
          {
            opacity: cardFade,
            transform: [
              { translateY: cardSlide },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Ionicons name="megaphone" size={20} color="#4299e1" style={styles.cardIcon} />
            <Text style={styles.cardTitle}>{item.title}</Text>
          </View>
          <Text style={styles.cardDate}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.cardContent}>{item.content}</Text>
        {isAdmin && (
          <TouchableOpacity style={styles.deleteButtonSolid} onPress={() => deleteAnnouncement(item.id)}>
            <Ionicons name="trash" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  const AnimatedFAB = () => (
    <Animated.View
      style={[
        styles.fabContainer,
        {
          opacity: fabAnim,
          transform: [
            { scale: fabAnim },
            { scale: pulseAnim }
          ]
        }
      ]}
    >
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateAnnouncement')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
      
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          { transform: [{ translateY: headerAnim }] }
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#4299e1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Announcements</Text>
          <View style={styles.headerSpacer} />
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {announcements.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={80} color="#718096" />
            <Text style={styles.emptyText}>No announcements yet</Text>
            <Text style={styles.emptySubtext}>Check back later for updates!</Text>
          </View>
        ) : (
          <FlatList
            data={announcements}
            renderItem={({ item }) => (
              <View style={styles.announcementCard}>
                <View style={styles.announcementContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.titleContainer}>
                      <Ionicons name="megaphone" size={20} color="#4299e1" style={styles.cardIcon} />
                      <Text style={styles.cardTitle}>{item.title}</Text>
                    </View>
                    <Text style={styles.cardDate}>
                      {new Date(item.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.cardContent}>{item.content}</Text>
                </View>
                {isAdmin && (
                  <TouchableOpacity style={styles.deleteButtonSolid} onPress={() => deleteAnnouncement(item.id)}>
                    <Ionicons name="trash" size={22} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </Animated.View>

      {/* FAB */}
      {isAdmin && <AnimatedFAB />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a365d', // Deep navy blue background
  },
  header: {
    backgroundColor: 'rgba(66, 153, 225, 0.1)', // Professional blue with transparency
    borderBottomWidth: 1,
    borderBottomColor: '#4299e1',
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(66, 153, 225, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4299e1', // Professional blue
    textShadowColor: 'rgba(66, 153, 225, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  listContainer: {
    paddingBottom: 100,
  },
  announcementCard: {
    backgroundColor: '#e2e8f0', // solid, lighter than background
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(66,153,225,0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  announcementContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4299e1', // Professional blue
    flex: 1,
    textShadowColor: 'rgba(66, 153, 225, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardDate: {
    color: '#4299e1',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cardContent: {
    fontSize: 14,
    color: '#e2e8f0', // Light gray
    lineHeight: 20,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(229, 62, 62, 0.1)', // Red with transparency
  },
  deleteButtonSolid: {
    backgroundColor: '#e53e3e',
    borderRadius: 8,
    padding: 10,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#718096', // Medium gray
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#a0aec0', // Light gray
    marginTop: 8,
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4299e1', // Professional blue
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  swipeDelete: {
    backgroundColor: '#e53e3e',
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
    height: '100%',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  swipeDeleteInstant: {
    backgroundColor: '#e53e3e',
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
    height: '100%',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
});