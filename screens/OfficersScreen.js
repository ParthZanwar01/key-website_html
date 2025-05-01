import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OfficersScreen() {
  // Sample officers data - replace with your actual officers
  const officers = [
    {
      id: '1',
      name: "Bella Pham",
      position: "Vice President",
      email: "bellapham@example.com",
      bio: "Class of 2026 – 3-year member. Fun Fact: I was born in Connecticut.",
      imageSource: require('../assets/images/officers/bella.png'),
    },
    {
      id: '2',
      name: "Svar Chandak",
      position: "Treasurer",
      email: "svar@example.com",
      bio: "Class of 2027 – 2-year member. Fun Fact: I ripped my ear in half once while playing baseball.",
      imageSource: require('../assets/images/officers/svar.png'),
    },
    {
      id: '3',
      name: "Cody Nguyen",
      position: "Treasurer",
      email: "cody@example.com",
      bio: "Class of 2027 – 2-year member. Fun Fact: I’ve been playing piano for 8 years.",
      imageSource: require('../assets/images/officers/cody.png'),
    },
    {
      id: '4',
      name: "Shamoel Daudjee",
      position: "Hours Manager",
      email: "shamoel@example.com",
      bio: "Class of 2027 – 2-year member. Fun Fact: I was born in Africa.",
      imageSource: require('../assets/images/officers/shamoel.png'),
    },
    {
      id: '5',
      name: "Arjun Diwakar",
      position: "Event Chairman",
      email: "ariun@example.com",
      bio: "Class of 2027 – 2-year member. Fun Fact: I’ve never watched Star Wars.",
      imageSource: require('../assets/images/officers/arjun.png'),
    },
  ];

  const handleEmailPress = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  const renderOfficer = ({ item }) => (
    <View style={styles.officerCard}>
      <Image
        source={item.imageSource}
        style={styles.officerImage}
      />
      <View style={styles.officerDetails}>
        <Text style={styles.officerName}>{item.name}</Text>
        <Text style={styles.officerPosition}>{item.position}</Text>
        <TouchableOpacity onPress={() => handleEmailPress(item.email)}>
          <Text style={styles.officerEmail}>{item.email}</Text>
        </TouchableOpacity>
        <Text style={styles.officerBio}>{item.bio}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Our Leadership Team</Text>
        <Text style={styles.headerSubtitle}>
          Meet the dedicated individuals who make our events possible.
        </Text>
      </View>

      <FlatList
        data={officers}
        renderItem={renderOfficer}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.contactSection}>
        <Text style={styles.contactTitle}>Contact Our Leadership</Text>
        <Text style={styles.contactText}>
          Have questions for our team? Feel free to reach out to any of our officers.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#94cfec',
  },
  header: {
    padding: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    padding: 15,
  },
  officerCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  officerImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  officerDetails: {
    padding: 15,
  },
  officerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  officerPosition: {
    fontSize: 16,
    color: '#59a2f0',
    marginBottom: 5,
  },
  officerEmail: {
    fontSize: 14,
    color: '#0066cc',
    marginBottom: 10,
  },
  officerBio: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  contactSection: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
});