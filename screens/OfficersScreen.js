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
      name: "Jane Smith",
      position: "President",
      email: "president@organization.com",
      bio: "Jane has been with the organization for 5 years and specializes in community outreach and partnership development.",
      imageUrl: "https://via.placeholder.com/150"
    },
    {
      id: '2',
      name: "John Doe",
      position: "Vice President",
      email: "vp@organization.com",
      bio: "John joined the leadership team in 2023 and brings extensive experience in event management and fundraising.",
      imageUrl: "https://via.placeholder.com/150"
    },
    {
      id: '3',
      name: "Maria Garcia",
      position: "Secretary",
      email: "secretary@organization.com",
      bio: "Maria has been our secretary for 2 years and maintains our records and communications with precision and care.",
      imageUrl: "https://via.placeholder.com/150"
    },
    {
      id: '4',
      name: "David Kim",
      position: "Treasurer",
      email: "treasurer@organization.com",
      bio: "David handles all financial matters and has helped secure several grants for our organization.",
      imageUrl: "https://via.placeholder.com/150"
    }
  ];

  const handleEmailPress = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  const renderOfficer = ({ item }) => (
    <View style={styles.officerCard}>
      <Image
        source={{ uri: item.imageUrl }}
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
    padding: 20,
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