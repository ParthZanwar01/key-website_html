import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ImageBackground
} from 'react-native';

const { width } = Dimensions.get('window');
const cardWidth = width / 2 - 15; // Half screen width minus margin

export default function OfficersScreen() {
  // Officer data based on your images
  const officers = [
    {
      id: '1',
      name: "Bella       Pham",
      position: "President",
      classYear: "2026",
      memberYears: "3",
      imageSource: require('../assets/images/officers/bella.png'),
    },
    {
      id: '2',
      name: "Jacob Harred",
      position: "Vice President",
      classYear: "2026",
      memberYears: "3",
      imageSource: require('../assets/images/officers/jacob.png'),
    },
    {
      id: '3',
      name: "Cody Nguyen",
      position: "Treasurer",
      classYear: "2027",
      memberYears: "2",
      imageSource: require('../assets/images/officers/cody.png'),
    },
    {
      id: '4',
      name: "Shamoel Daudjee",
      position: "Hours Manager",
      classYear: "2027",
      memberYears: "2",
      imageSource: require('../assets/images/officers/shamoel.png'),
    },
    {
      id: '5',
      name: "Svar Chandak",
      position: "Treasurer",
      classYear: "2027",
      memberYears: "2",
      imageSource: require('../assets/images/officers/svar.png'),
    },
    {
      id: '6',
      name: "Arjun Diwakar",
      position: "Event Chairman",
      classYear: "2027",
      memberYears: "2",
      imageSource: require('../assets/images/officers/arjun.png'),
    },
  ];

  const renderOfficerCard = ({ item, index }) => (
    <View style={[styles.cardContainer, { marginLeft: index % 2 === 0 ? 10 : 5, marginRight: index % 2 === 0 ? 5 : 10 }]}>
      <View style={styles.officerCard}>
        {/* Key Club logo */}
        <Image 
          source={require('../assets/images/keyclublogo.png')} 
          style={styles.keyClubLogo} 
          resizeMode="contain"
        />
        
        {/* Background with string lights */}
        <ImageBackground
          source={require('../assets/images/string_lights_bg.png')}
          style={styles.cardBackground}
          resizeMode="cover"
        >
          {/* Officer photo */}
          <View style={styles.photoContainer}>
            <Image
              source={item.imageSource}
              style={styles.officerImage}
              resizeMode="cover"
            />
          </View>
          
          {/* Officer name */}
          <View style={styles.nameContainer}>
            <Text style={styles.officerName}>{item.name}</Text>
          </View>
          
          {/* Officer details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.classInfo}>Class of {item.classYear}</Text>
            <Text style={styles.memberInfo}>{item.memberYears}-year member</Text>
            
          </View>
        </ImageBackground>
        
        {/* Floral border at bottom */}
        <Image 
          source={require('../assets/images/floral_border.png')} 
          style={styles.floralBorder} 
          resizeMode="cover"
        />
        
        {/* Position banner */}
        <View style={styles.positionContainer}>
          <Text style={styles.positionText}>{item.position}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Our Leadership Team</Text>
        <Text style={styles.headerSubtitle}>
          Meet the dedicated individuals who lead our Key Club.
        </Text>
      </View>

      <FlatList
        data={officers}
        renderItem={renderOfficerCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        numColumns={2}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1b2a',
  },
  header: {
    padding: 16,
    backgroundColor: '#0d1b2a',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2a3950',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffd60a',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  listContainer: {
    paddingVertical: 10,
    paddingBottom: 30,
  },
  cardContainer: {
    width: cardWidth,
    marginBottom: 20,
  },
  officerCard: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 480,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  keyClubLogo: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 30,
    height: 30,
    opacity: 0.8,
    zIndex: 10,
  },
  cardBackground: {
    width: '100%',
    height: '100%',
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#2d3748', // Fallback color if image doesn't load
  },
  photoContainer: {
    marginTop: 30,
    marginBottom: 15,
    width: cardWidth - 40,
    height: 200,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#fff',
  },
  officerImage: {
    width: '100%',
    height: '100%',
  },
  nameContainer: {
    marginBottom: 8,
  },
  officerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textAlign: 'center',
  },
  detailsContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  classInfo: {
    fontSize: 16,
    color: '#e2e8f0',
    textAlign: 'center',
  },
  memberInfo: {
    fontSize: 16,
    color: '#e2e8f0',
    textAlign: 'center',
    marginBottom: 15,
  },
  funFactLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f3f4f6',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  funFactText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#f3f4f6',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  floralBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    width: '100%',
  },
  positionContainer: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  positionText: {
    backgroundColor: '#f8a3a3',
    color: '#0d1b2a',
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    textAlign: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});