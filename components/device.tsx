import { useEffect, useState } from "react"
import { Button, StyleSheet, Text, TextInput, ToastAndroid, View } from "react-native"
import { BluetoothDeviceStatus } from "./bluetoothdevicescan";
import RNBluetoothClassic from "react-native-bluetooth-classic";

interface DeviceProps {
    navigation: any,
    route: any
}

const styles = StyleSheet.create({
    btnContainer: {
        width: "100%",
        justifyContent: 'center',
        alignItems: 'center',
        bottom: 30,
        height: 70,
        flexDirection: "row",
        flexWrap: "wrap",
        padding: 12,
        gap: 5,
        marginTop: 20
    },
    input: {
        width: "80%",
        height: 40,
        margin: 10,
        borderWidth: 2,
        padding: 10,
    },
    container: {
        position: "relative",
        top: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    macrobtnContainer: {
        width: "80%",
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 5
    }
});

const Device = ({ route, navigation }: DeviceProps): React.JSX.Element => {
    const [msgToSend, setMsgToSend] = useState('');
    const [isCustomRequested, setIsCustomRequest] = useState<boolean>();
    const [duration, setDuration] = useState<string>();
    const { addr, item } = route.params;

    useEffect(() => {
    }, []);

    const sendToDevice = async (address: string, msg: string) => {
        try {
            if (await RNBluetoothClassic.isDeviceConnected(address)) {
                await RNBluetoothClassic.writeToDevice(addr, msg, "utf-8");
            } else {
                ToastAndroid.show("Connection lost, attempting to re-connect", 1000);
                await RNBluetoothClassic.connectToDevice(addr);
            }
        } catch (error) {
            if(error instanceof Error){
                ToastAndroid.show(`${error.message}`, 1000);
            }
        }
        
    }
    return (
        <>
            <View style={{justifyContent: 'center', alignItems: "center"}}>
                <Text style={{fontFamily: "Segoe UI", fontWeight: "800", fontSize: 24}}>{item.name}</Text>
            </View>
            <View style={styles.container}>
                {isCustomRequested && <TextInput onChangeText={setMsgToSend} placeholder="Enter your message" style={styles.input} />}
                <TextInput onChangeText={setDuration} placeholder="Enter duration" style={styles.input} />
                <View style={styles.btnContainer}>
                    <Button title="Send" onPress={() => sendToDevice(addr, msgToSend)} />
                    <Button title="Cancel" onPress={() => navigation.goBack()} />
                </View>
                <View style={styles.macrobtnContainer}>
                    <Button title="10 min" onPress={() => setMsgToSend("set,10," + duration)} />
                    <Button title="15 min" onPress={() => setMsgToSend("set,15," + duration)} />
                    <Button title="30 min" onPress={() => setMsgToSend("set,30," + duration)} />
                    <Button title="45 min" onPress={() => setMsgToSend("set,45," + duration)} />
                    <Button title="Reset" onPress={() => setMsgToSend("reset")} />
                    <Button title="Custom" onPress={() => setIsCustomRequest(true)} />
                </View>
            </View>
        </>

    );
}

export default Device;