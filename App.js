import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome'; // Vector Icon
import Home from './src/Screen/Home';
import Settings from './src/Screen/Settings'; // Yeni bir ekran örneği
import DayCalendar from './src/Screen/DayCalendar';

// Pixel Art tarzında yazı stili
const PixelArtText = (props) => {
  return <Text {...props} style={[props.style, { fontFamily: 'PressStart2P-Regular', fontSize: 7 }]} />;
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator component
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown:false,
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Settings') {
            iconName = 'cog';
          }

          // İkonları Pixel Art temasıyla uyumlu olacak şekilde ayarlayın
          return <FontAwesome name={iconName} size={size} color={color} />;
        },
        tabBarLabel: ({ color }) => (
          <PixelArtText style={{ color }}>{route.name}</PixelArtText>
        ),
      })}
      tabBarOptions={{
       
        activeTintColor: 'green',  // Seçili olan sekmenin rengi
        inactiveTintColor: 'gray', // Seçili olmayan sekmenin rengi
        style: {
          backgroundColor: '#f0f0f0',
        },
      }}
    >
      
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Day" component={DayCalendar} />
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
}

// Main App component
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Tab Navigator stack'e eklenir */}
        <Stack.Screen name="Main" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
