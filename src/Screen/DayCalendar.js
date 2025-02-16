import React, { useState, useEffect, useRef } from 'react';
import { View, Text as DefaultText, ScrollView, TouchableOpacity, Modal, TextInput as DefaultTextInput, StyleSheet, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

// Pixel Art stilinde Text bileşeni
const PixelArtText = (props) => {
  return <DefaultText {...props} style={[props.style, { fontFamily: 'PressStart2P-Regular', fontSize: 12 }]} />;
};

// Pixel Art stilinde TextInput bileşeni
const PixelArtTextInput = (props) => {
  return (
    <DefaultTextInput
      {...props}
      style={[props.style, { fontFamily: 'PressStart2P-Regular', borderWidth: 2, borderColor: '#000', padding: 10, backgroundColor: '#FFF', color: '#000' }]}
    />
  );
};

// Pixel Art stilinde Buton bileşeni
const PixelArtButton = ({ onPress, title, style }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.pixelButton, style]}>
      <PixelArtText style={styles.pixelButtonText}>{title}</PixelArtText>
    </TouchableOpacity>
  );
};

export default function DayCalendar() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHour, setSelectedHour] = useState(null);
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const scrollViewRef = useRef(null);

  const onDayPress = async (date) => {
    try {
      const loadedEvents = await loadEvent(date);
      if (Array.isArray(loadedEvents)) {
        console.log("Yüklenecek görevler: ", loadedEvents); // Yüklenecek görevler doğru mu?
        setTasks(loadedEvents); // Görevleri state'e koyuyoruz
      } else {
        console.log("Görev yok!");
        setTasks([]);
      }
      setSelectedDate(date);
      setModalVisible(true); // Modalı aç
    } catch (e) {
      console.error('Etkinlikler yüklenemedi:', e);
      setTasks([]);
    }
  };
  

  // Zamanı her 15 saniyede bir güncelle
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(intervalId);
  }, []);

  // Görevleri AsyncStorage'dan yükle
  useEffect(() => {
    loadTasks();
  }, [selectedDate]);

  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks !== null) {
        const allTasks = JSON.parse(storedTasks);
        const dateKey = moment(selectedDate).format('YYYY-MM-DD');
        setTasks(allTasks[dateKey] || {});
      }
    } catch (error) {
      console.error('Görevler yüklenemedi:', error);
    }
  };

  const saveTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      const allTasks = storedTasks ? JSON.parse(storedTasks) : {};
      const dateKey = moment(selectedDate).format('YYYY-MM-DD');
      const updatedTasksForDate = { ...allTasks, [dateKey]: tasks };
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasksForDate));
    } catch (error) {
      console.error('Görevler kaydedilemedi:', error);
    }
  };

  const addTask = () => {
    if (selectedHour !== null && task) {
      const updatedTasks = { ...tasks, [selectedHour]: task };
      setTasks(updatedTasks);
      saveTasks();
      setTask('');
      setModalVisible(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  const hourBlockHeight = 50;

  const currentTimeLinePosition = (currentMinutes / 60) * hourBlockHeight;

  const goToNextDay = () => {
    setSelectedDate(moment(selectedDate).add(1, 'days').toDate());
  };

  const goToPreviousDay = () => {
    setSelectedDate(moment(selectedDate).subtract(1, 'days').toDate());
  };

  const scrollToTop = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const isToday = moment(selectedDate).isSame(moment(), 'day');

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <View style={styles.dateContainer}>
        <PixelArtButton title="<< Geri" onPress={goToPreviousDay} />
        <PixelArtText style={styles.dateText}>
          {moment(selectedDate).format('DD/MM/YYYY')}
        </PixelArtText>
        <PixelArtButton title="İleri >>" onPress={goToNextDay} />
      </View>

      <PixelArtButton title="En Üste Kaydır" onPress={scrollToTop} style={styles.scrollToTopButton} />

      <ScrollView style={styles.calendar} ref={scrollViewRef}>
        {hours.map((hour) => (
          <View key={hour} style={{ position: 'relative' }}>
            <TouchableOpacity
              style={[styles.hourBlock, { height: hourBlockHeight }]}
              onPress={() => {
                setSelectedHour(hour);
                setModalVisible(true);
              }}
            >
              <PixelArtText style={styles.hourText}>{hour}:00</PixelArtText>
              <PixelArtText style={styles.taskText}>
                {tasks[hour] || ''}
              </PixelArtText>

              {tasks[hour] && (
                <View style={styles.taskBubble}>
                  <PixelArtText style={styles.taskBubbleText}>{tasks[hour]}</PixelArtText>
                </View>
              )}
            </TouchableOpacity>

            {isToday && currentHour === hour && (
              <View
                style={[
                  styles.currentTimeLine,
                  { top: currentTimeLinePosition },
                ]}
              />
            )}
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <PixelArtText style={styles.modalTitle}>Görev Ekle {selectedHour}:00</PixelArtText>
            <PixelArtTextInput
              style={styles.textInput}
              placeholder="Görevi Girin"
              value={task}
              onChangeText={setTask}
            />

            <PixelArtButton title="Kaydet" onPress={addTask} style={styles.modalButton} />
            <PixelArtButton title="İptal" onPress={() => setModalVisible(false)} style={[styles.modalButton, { backgroundColor: 'red' }]} />
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  dateText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calendar: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  hourBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#ccc',
  },
  hourText: {
    fontSize: 18,
  },
  taskText: {
    fontSize: 16,
    color: 'red',
  },
  taskBubble: {
    backgroundColor: '#FFEB3B',
    padding: 5,
    borderRadius: 5,
    position: 'absolute',
    top: 5,
    right: 10,
  },
  taskBubbleText: {
    fontSize: 12,
    fontFamily: 'PressStart2P-Regular',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 15,
  },
  textInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    padding: 10,
  },
  pixelButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  pixelButtonText: {
    color: '#FFF',
    fontFamily: 'PressStart2P-Regular',
    fontSize: 14,
  },
  modalButton: {
    width: '100%',
  },
  currentTimeLine: {
    height: 2,
    backgroundColor: 'red',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  scrollToTopButton: {
    marginBottom: 10,
  },
});
