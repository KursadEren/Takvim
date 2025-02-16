import React, { useState } from 'react';
import { View, Text as DefaultText, TouchableOpacity, StyleSheet, Modal, TextInput as DefaultTextInput, ScrollView, FlatList, Dimensions } from 'react-native';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const { width, height } = Dimensions.get('window');

// Pixel Art yazı formatı
const PixelArtText = (props) => {
  return <DefaultText {...props} style={[props.style, { fontFamily: 'PressStart2P-Regular', fontSize: 12 }]} />;
};

// Haftanın başlangıç gününü Pazar olarak ayarla
moment.updateLocale('en', {
  week: {
    dow: 0, // Haftanın başlangıç günü Pazar (0), Pazartesi için (1) kullanılır.
  },
});

// Global Text Component for consistent font
const Text = (props) => {
  return <DefaultText {...props} style={[props.style, { fontFamily: 'PressStart2P-Regular' }]} />;
};

// Global TextInput Component for consistent font
const TextInput = (props) => {
  return <DefaultTextInput {...props} style={[props.style, { fontFamily: 'PressStart2P-Regular', borderWidth: 2, borderColor: '#000', padding: 10, backgroundColor: '#FFF', color: '#000' }]} />;
};

// Etkinlikleri AsyncStorage'da kaydetme
const saveEvent = async (date, events) => {
  try {
    await AsyncStorage.setItem(date, JSON.stringify(events));
    console.log(`${date} tarihine kaydedilen etkinlikler:`, events);
  } catch (e) {
    console.error('Etkinlikler kaydedilemedi:', e);
  }
};



// Etkinlikleri AsyncStorage'dan yükleme
const loadEvent = async (date) => {
  try {
    const event = await AsyncStorage.getItem(date);
    if (event !== null) {
      console.log(`${date} tarihine yüklenecek etkinlikler:`, JSON.parse(event));
      return JSON.parse(event);
    }
    console.log(`${date} tarihine etkinlik bulunamadı.`);
    return [];
  } catch (e) {
    console.error('Etkinlikler yüklenemedi:', e);
    return [];
  }
};

const CalendarHeader = ({ currentMonth, setCurrentMonth }) => {
  const handlePreviousMonth = () => {
    setCurrentMonth(moment(currentMonth).subtract(1, 'month').format('YYYY-MM-DD'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(moment(currentMonth).add(1, 'month').format('YYYY-MM-DD'));
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={handlePreviousMonth}>
        <Text style={styles.arrow}>{"<<"}</Text>
      </TouchableOpacity>
      <Text style={styles.monthText}>{moment(currentMonth).format('MMMM YYYY')}</Text>
      <TouchableOpacity onPress={handleNextMonth}>
        <Text style={styles.arrow}>{">>"}</Text>
      </TouchableOpacity>
    </View>
  );
};

const CalendarDays = ({ currentMonth, onDayPress, selectedDates, setSelectedDates, isMultiSelect }) => {
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const generateDays = () => {
    const startOfMonth = moment(currentMonth).startOf('month').startOf('week');
    const endOfMonth = moment(currentMonth).endOf('month').endOf('week');

    let days = [];
    let day = startOfMonth;

    while (day <= endOfMonth) {
      days.push(day.clone());
      day.add(1, 'day');
    }

    return days;
  };

  const handleDayPress = (day) => {
    const dateString = day.format('YYYY-MM-DD');
    if (isMultiSelect) {
      if (selectedDates.includes(dateString)) {
        setSelectedDates(selectedDates.filter(d => d !== dateString));
      } else {
        setSelectedDates([...selectedDates, dateString]);
      }
    } else {
      onDayPress(dateString);
    }
  };

  const days = generateDays();

  return (
    <View style={styles.daysContainer}>
      <View style={styles.weekContainer}>
        {daysOfWeek.map((day, index) => (
          <PixelArtText key={index} style={styles.weekDay}>{day}</PixelArtText>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {days.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayCell,
              selectedDates.includes(day.format('YYYY-MM-DD')) && styles.selectedDay,
            ]}
            onPress={() => handleDayPress(day)}
          >
            <PixelArtText style={styles.dayText}>
              {day.format('D')}
            </PixelArtText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(moment().format('YYYY-MM-DD'));
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDates, setSelectedDates] = useState([]); // Çoklu seçim için
  const [modalVisible, setModalVisible] = useState(false);
  const [multiTaskModalVisible, setMultiTaskModalVisible] = useState(false); // Çoklu görev modalı
  const [tasks, setTasks] = useState([{ startTime: '', endTime: '', task: '', priority: 'normal' }]);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(null); // Seçilen görevi takip edin
  const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);
  const [isMultiSelect, setIsMultiSelect] = useState(false); // Çoklu seçim modu

  const toggleMultiSelect = () => {
    setIsMultiSelect(!isMultiSelect);
    if (!isMultiSelect) {
      setSelectedDates([]); // Modu kapatınca seçilen tarihleri temizle
    }
  };

  const onDayPress = async (date) => {
    try {
      const loadedEvents = await loadEvent(date);
      if (Array.isArray(loadedEvents)) {
        setTasks(loadedEvents);
      } else {
        setTasks([]);
      }
      setSelectedDate(date);
      setModalVisible(true); // Tek tarih için modal açılır
    } catch (e) {
      console.error('Etkinlikler yüklenemedi:', e);
      setTasks([]);
    }
  };

  const handleTaskChange = (index, field, value) => {
    const updatedTasks = [...tasks];
    updatedTasks[index][field] = value;
    setTasks(updatedTasks);
  };

  const togglePriority = (index) => {
    const updatedTasks = [...tasks];
    switch (updatedTasks[index].priority) {
      case 'normal':
        updatedTasks[index].priority = 'medium';
        break;
      case 'medium':
        updatedTasks[index].priority = 'high';
        break;
      case 'high':
      default:
        updatedTasks[index].priority = 'normal';
        break;
    }
    setTasks(updatedTasks);
  };

  const addTask = () => {
    setTasks([...tasks, { startTime: '', endTime: '', task: '', priority: 'normal' }]);
  };
  
  const saveTasksForSelectedDate = async () => {
    const filteredTasks = tasks.filter(task => task.startTime && task.endTime && task.task);
  
    try {
      // Mevcut görevleri yükle
      const existingTasks = await loadEvent(selectedDate);
  
      // Yeni görevleri mevcut görevlerin sonuna ekle
      const updatedTasks = [...existingTasks, ...filteredTasks];
  
      // Görevleri kaydet
      await saveEvent(selectedDate, updatedTasks);
  
      // Görevleri kaydettikten sonra giriş alanlarını temizle
      setTasks([{ startTime: '', endTime: '', task: '', priority: 'normal' }]);
  
      setModalVisible(false); // Modalı kapat
    } catch (e) {
      console.error('Görevler kaydedilirken hata oluştu:', e);
    }
  };
  
  const saveTasksForMultipleDates = async () => {
    const filteredTasks = tasks.filter(task => task.startTime && task.endTime && task.task);
  
    try {
      // Seçili tarihlerin her birine aynı görevleri ekle
      for (let date of selectedDates) {
        // Mevcut görevleri yükle
        const existingTasks = await loadEvent(date);
  
        // Yeni görevleri mevcut görevlerin sonuna ekle
        const updatedTasks = [...existingTasks, ...filteredTasks];
  
        // Görevleri kaydet
        await saveEvent(date, updatedTasks);
      }
  
      // Görevleri kaydettikten sonra giriş alanlarını ve seçilen tarihleri temizle
      setTasks([{ startTime: '', endTime: '', task: '', priority: 'normal' }]);
      setSelectedDates([]); // FlatList'i temizlemek için seçilen tarihleri temizle
  
      setMultiTaskModalVisible(false); // Çoklu görev modalını kapat
    } catch (e) {
      console.error('Görevler kaydedilirken hata oluştu:', e);
    }
  };
  

  const showStartDatePicker = (index) => {
    setSelectedTaskIndex(index); // Hangi görev olduğunu takip edin
    setStartDatePickerVisibility(true);
  };

  const showEndDatePicker = (index) => {
    setSelectedTaskIndex(index); // Hangi görev olduğunu takip edin
    setEndDatePickerVisibility(true);
  };

  const hideStartDatePicker = () => {
    setStartDatePickerVisibility(false);
  };

  const hideEndDatePicker = () => {
    setEndDatePickerVisibility(false);
  };

  const handleStartConfirm = (date) => {
    const time = moment(date).format('HH:mm');
    const updatedTasks = [...tasks];
    updatedTasks[selectedTaskIndex].startTime = time; // Seçilen görevin başlangıç saatini ayarla
    setTasks(updatedTasks);
    hideStartDatePicker();
  };

  const handleEndConfirm = (date) => {
    const time = moment(date).format('HH:mm');
    const updatedTasks = [...tasks];
    updatedTasks[selectedTaskIndex].endTime = time; // Seçilen görevin bitiş saatini ayarla
    setTasks(updatedTasks);
    hideEndDatePicker();
  };

  const getTaskStyle = (priority) => {
    switch (priority) {
      case 'high':
        return { backgroundColor: 'red', color: 'white' };
      case 'medium':
        return { backgroundColor: 'blue', color: 'white' };
      case 'normal':
      default:
        return { backgroundColor: 'green', color: 'white' };
    }
  };

  return (
    <View>
      <CalendarHeader
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
      />
      <TouchableOpacity onPress={toggleMultiSelect} style={styles.multiSelectButton}>
        <Text>{isMultiSelect ? 'Modu Kapat' : 'Modu Aç'}</Text>
      </TouchableOpacity>
      <CalendarDays
        currentMonth={currentMonth}
        onDayPress={onDayPress}
        selectedDates={selectedDates}
        setSelectedDates={setSelectedDates}
        isMultiSelect={isMultiSelect}
      />
      {/* FlatList Seçilen Tarihleri Göster */}
      <FlatList
        data={selectedDates}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.dateTaskContainer}>
            <PixelArtText>{item}</PixelArtText>
          </View>
        )}
      />
      {isMultiSelect && selectedDates.length > 0 && (
        <TouchableOpacity
          style={styles.multiTaskButton}
          onPress={() => setMultiTaskModalVisible(true)}
        >
          <Text style={styles.multiTaskButtonText}>Seçilen Tarihlere Görev Ekle</Text>
        </TouchableOpacity>
      )}

      {/* Tek tarih için modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(!modalVisible)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Görevler Ekle</Text>
            <Text style={styles.modalDate}>Seçilen Tarih: {selectedDate}</Text>

            <ScrollView style={styles.scrollView}>
              {tasks.map((task, index) => (
                <View key={index} style={styles.taskContainer}>
                  <View style={styles.TimeContainer}>
                    <TouchableOpacity onPress={() => showStartDatePicker(index)}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Başlangıç Saatini Seçin"
                        value={task.startTime}
                        editable={false}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => showEndDatePicker(index)}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Bitiş Saatini Seçin"
                        value={task.endTime}
                        editable={false}
                      />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Görev Girin"
                    value={task.task}
                    onChangeText={(text) => handleTaskChange(index, 'task', text)}
                  />

                  <TouchableOpacity onPress={() => togglePriority(index)}>
                    <Text style={[styles.priorityButton, getTaskStyle(task.priority)]}>
                      {task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Normal'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.button} onPress={addTask}>
                <Text style={styles.buttonText}>Yeni Görev Ekle</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={saveTasksForSelectedDate}>
                <Text style={styles.buttonText}>Kaydet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: 'red' }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>İptal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Çoklu tarihler için modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={multiTaskModalVisible}
        onRequestClose={() => setMultiTaskModalVisible(!multiTaskModalVisible)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Seçilen Tarihlere Görevler Ekle</Text>

            <ScrollView style={styles.scrollView}>
              {tasks.map((task, index) => (
                <View key={index} style={styles.taskContainer}>
                  <View style={styles.TimeContainer}>
                    <TouchableOpacity onPress={() => showStartDatePicker(index)}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Başlangıç Saatini Seçin"
                        value={task.startTime}
                        editable={false}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => showEndDatePicker(index)}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Bitiş Saatini Seçin"
                        value={task.endTime}
                        editable={false}
                      />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Görev Girin"
                    value={task.task}
                    onChangeText={(text) => handleTaskChange(index, 'task', text)}
                  />

                  <TouchableOpacity onPress={() => togglePriority(index)}>
                    <Text style={[styles.priorityButton, getTaskStyle(task.priority)]}>
                      {task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Normal'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.button} onPress={addTask}>
                <Text style={styles.buttonText}>Yeni Görev Ekle</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={saveTasksForMultipleDates}>
                <Text style={styles.buttonText}>Seçilen Tarihlere Kaydet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: 'red' }]} onPress={() => setMultiTaskModalVisible(false)}>
                <Text style={styles.buttonText}>İptal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <DateTimePickerModal
        isVisible={isStartDatePickerVisible}
        mode="time"
        onConfirm={handleStartConfirm}
        onCancel={hideStartDatePicker}
      />

      <DateTimePickerModal
        isVisible={isEndDatePickerVisible}
        mode="time"
        onConfirm={handleEndConfirm}
        onCancel={hideEndDatePicker}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#303030',
    borderRadius: 8,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: 350,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'PressStart2P-Regular',
    marginBottom: 10,
  },
  modalDate: {
    fontSize: 16,
    marginBottom: 20,
  },
  scrollView: {
    width: '100%',
    marginBottom: 20,
  },
  textInput: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#000',
    padding: 10,
    backgroundColor: '#FFF',
    color: '#000',
    marginBottom: 10,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    width: '30%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontFamily: 'PressStart2P-Regular',
    fontSize: 14,
  },
  arrow: {
    fontSize: 24,
    color: '#4CAF50',
  },
  monthText: {
    fontSize: 16,
    color: '#FFF',
  },
  daysContainer: {
    marginTop: 10,
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    backgroundColor: '#212121',
    padding: 5,
    borderRadius: 8,
  },
  weekDay: {
    width: '14%',
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontSize: 12,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#424242',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCell: {
    width: (width / 7) - 8,
    height: (height / 12) - 8,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    margin: 2,
    backgroundColor: '#FFEB3B',
    borderRadius: 4,
  },
  selectedDay: {
    backgroundColor: '#4CAF50',
  },
  dayText: {
    fontSize: 14,
    color: '#212121',
  },
  TimeContainer: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'space-around',
    flexDirection: 'row',
  },
  priorityButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginVertical: 10,
    textAlign: 'center',
  },
  multiSelectButton: {
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  dateTaskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
    padding: 10,
    backgroundColor: '#DDDDDD',
    borderRadius: 8,
  },
  multiTaskButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  multiTaskButtonText: {
    color: '#FFF',
    fontFamily: 'PressStart2P-Regular',
  },
});

export default Calendar;
