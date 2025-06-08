import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { supabase } from '../supabase/supabaseClient';
import { useNavigation } from '@react-navigation/native';

export default function CreateAnnouncementScreen() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const navigation = useNavigation();

  const createAnnouncement = async () => {
    if (!title || !message) {
      Alert.alert('Fill all fields');
      return;
    }

    const { error } = await supabase.from('announcements').insert([{ title, message, date: new Date() }]);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Announcement posted');
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} />
      <TextInput
        placeholder="Message"
        value={message}
        onChangeText={setMessage}
        style={[styles.input, { height: 100 }]}
        multiline
      />
      <Button title="Post Announcement" onPress={createAnnouncement} color="#00b894" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
});