/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import type { PropsWithChildren } from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import BluetoothDeviceScan from './components/bluetoothdevicescan';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Device from './components/device';

type SectionProps = PropsWithChildren<{
  title: string;
}>;


const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';


  return (
     <NavigationContainer>
      <StatusBar backgroundColor={"orange"} animated={false} barStyle={'dark-content'}></StatusBar>
      <Stack.Navigator initialRouteName='Scan'>
        <Stack.Screen name='Scan' component={BluetoothDeviceScan} />
        <Stack.Screen name='Device' component={Device} />
      </Stack.Navigator>      
     </NavigationContainer>
  );
}


export default App;
