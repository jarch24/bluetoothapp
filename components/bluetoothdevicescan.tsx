import React, { useEffect, useState } from "react";
import { Button, FlatList, PermissionsAndroid, RefreshControl, StyleSheet, Text, ToastAndroid, TouchableOpacity, View } from "react-native"
import RNBluetoothClassic, { BluetoothDevice } from "react-native-bluetooth-classic";
import Spinner from "./spinner";
import { isLocationEnabled, promptForEnableLocationIfNeeded } from "react-native-android-location-enabler";

export interface BluetoothDeviceStatus {
    connected: boolean;
    addr: string;
    item: BluetoothDevice,
    bonded: boolean
}

export interface IRouter {
    navigation: any
}

const BluetoothDeviceScan = ({ navigation }: any): React.JSX.Element => {

    const REQUIREDPERMISSIONS = [PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
    const [scanProgress, setScanProgress] = useState<boolean>(false);
    const [devices, setDevices] = useState<BluetoothDeviceStatus[]>([]);
    const [blStateEnable, setBlStateEnable] = useState<boolean>(false);
    const [locEnableState, setLocEnableState] = useState<boolean>(false);

    useEffect(() => {
        //checkPermission();
        requestPermission();
        enableBluetooth();
        locationEnable();
        const subs = RNBluetoothClassic.onStateChanged((e) => {
            if(!e.enabled){
                ToastAndroid.show("Please turn on bluetooth", 1000);
                setBlStateEnable(false);
            }
        })
        return () => {
            subs.remove();
        }
    }, []);

    const requestPermission = async () => {
        await PermissionsAndroid.requestMultiple(REQUIREDPERMISSIONS);
        for (let permission of REQUIREDPERMISSIONS) {
            const permissionCheck = await PermissionsAndroid.check(permission);
            //ToastAndroid.show(`${permission} -> ${permissionCheck}`, 1000);
            if (!permissionCheck.valueOf()) {
            }
        }
    }

    const enableBluetooth = async () => {
        try {
            if (!await RNBluetoothClassic.isBluetoothEnabled()) {
                const isEnabled = await RNBluetoothClassic.requestBluetoothEnabled();
                if (isEnabled) {
                    setBlStateEnable(true);
                }
            }
            else {
                setBlStateEnable(true);
            }

        } catch (error) {
            setBlStateEnable(false);
        }
    }
    const locationEnable = async () => {
        if (!(await isLocationEnabled())) {
            try {
                let result = await promptForEnableLocationIfNeeded();
                if (result === "enabled" || result === "already-enabled") {
                    setLocEnableState(true);
                    return;
                }
                else {
                    setLocEnableState(false);
                }
            } catch (error: any) {
                setBlStateEnable(false);
                ToastAndroid.show("Please enable location and try again", 1000);
            }
        }
        else {
            setLocEnableState(true);
        }
    }

    const scanForDevices = async () => {
        if (blStateEnable && locEnableState) {
            setScanProgress(true);
            let devcs = await RNBluetoothClassic.startDiscovery();

            let devcss = devcs.filter(r => devices.findIndex(t => t.addr === r.address) === -1).map(t => {
                return {
                    item: t,
                    addr: t.address,
                    connected: false,
                    bonded: t.bonded
                } as BluetoothDeviceStatus
            });
            for (let device of devcss) {
                device.connected = await device.item.isConnected();
            }
            setDevices([...devices, ...devcss]);
            setScanProgress(false);

        }
    }

    const stopScan = async () => {
        await RNBluetoothClassic.cancelDiscovery();
        setScanProgress(false);
    }

    const connectDevice = async (address: string) => {
        //ToastAndroid.show(`Selected device: ${address}`, 1000);
        const device = devices.find(_ => _.addr === address);
        try {
            if (!await RNBluetoothClassic.isDeviceConnected(address)) {

                if(!device?.bonded){
                    await RNBluetoothClassic.pairDevice(address);
                    for (let device of devices) {
                        if (device.addr === address) {
                            device.bonded = true;
                            break;
                        }
                    }
                    setDevices([...devices]);
                }
                
                const connStatus = await RNBluetoothClassic.connectToDevice(address, { delimiter: "\n", secureSocket: true });
                if (connStatus?.address?.length > 0) {
                    let indx = devices.findIndex(t => t.addr === address);
                    devices.map((t, i) => {
                        if (i === indx) {
                            t.connected = true;
                        }
                    });

                    setDevices([...devices]);
                    navigation.navigate("Device", {addr: address, item: device?.item});
                }
            }
            else {
                navigation.navigate("Device", {addr: address, item: device?.item});
            }
        } catch (error) {
            const device = devices.find(r => r.addr === address);
            if (device?.connected) {
                await RNBluetoothClassic.disconnectFromDevice(address);
            }
            if (error instanceof Error) {
                ToastAndroid.show(`Failed to connect : ${JSON.stringify(error.message)}`, 2000);
            }
            if(device?.bonded){
                navigation.navigate("Device", {addr: address, item: device.item });
            }
        }
    }

    const sendToDevice = async (address: string, msg: string) => {
        if (!(await RNBluetoothClassic.isDeviceConnected(address))) {
            await connectDevice(address);
        } else {
            ToastAndroid.show("Connected sending", 1000);
            await RNBluetoothClassic.writeToDevice(address, msg, "utf-8");
        }
    }

    const disconnectDevice = async (address: string) => {

        let isBonded = devices.find(r => r.addr === address)?.bonded ?? false;
        if (isBonded) {
            try {
                await RNBluetoothClassic.unpairDevice(address);
                for (let device of devices) {
                    if (device.addr === address) {
                        device.bonded = false;
                        break;
                    }
                }
                setDevices([...devices]);
            } catch (error) {
                if (error instanceof Error)
                    ToastAndroid.show(`Unpair failed: ${error.message}`, 1000);
            }
        }
    }

    const styles = StyleSheet.create({
        btnContainer: {
            width: "100%",
            justifyContent: 'center',
            alignItems: 'center',
            position: "absolute",
            bottom: 10,
            height: 50,
            flexDirection: "row",
            gap: 15,
            flex: 1,
        },
        listItemContainer: {
            maxHeight: 670,
            padding: 5,
            backgroundColor: "transparent"
        },
        container: {
            flexDirection: "row",
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: "transparent",
            flex: 1
        },
        buttonScan: {
            alignItems: "center",
            padding: 10,
            backgroundColor: "#42ddf5",
            minWidth: 150
        },
        buttonScanCancel: {
            alignItems: "center",
            padding: 10,
            backgroundColor: "#f54242",
            minWidth: 150
        },
        textBtn: {
            color: "white",
            fontSize: 22,
            fontFamily: "Segoe UI",
            fontWeight: "600"
        },
        textListItem: {
            color: "gray",
            fontSize: 16,
            fontFamily: "Segoe UI",
            fontWeight: "700",
            padding: 5
        },
        centerText: {
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "aqua"
        },
        listItem: {
            margin: 5,
            backgroundColor: "#f7d79c",
            borderRadius: 3
        }
    });

    
    return (
        <>
            {scanProgress && <Spinner />}
            {devices.length > 0 ? <FlatList style={styles.listItemContainer} data={devices} renderItem={({ item }) => (
                <View style={styles.listItem}>
                    <View>
                        <Text style={styles.textListItem}>{item.item.name}</Text>
                        <Text style={styles.textListItem}>{item.addr}</Text>
                        {item.connected && <Text style={styles.textListItem}>Connected</Text>}
                        {item.bonded && <Text style={styles.textListItem}>Paired</Text>}
                        {!item.connected && <Button title="Connect" color={"#0af272"} onPress={async () => await connectDevice(item.addr)} />}
                        {item.connected || item.bonded && <Button title="Disconnect" color={"#eb4034"} onPress={async () => await disconnectDevice(item.addr)} />}
                    </View>

                </View>)} /> : <View style={styles.centerText}><Text>{"Scan to fetch available devices"}</Text></View>}


            <View style={styles.btnContainer}>
                <TouchableOpacity>
                    <Button disabled={scanProgress} title="Scan" color={"#42ddf5"} onPress={async () => await scanForDevices()} />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Button disabled={!scanProgress} title="Stop Scan" color={"#f54242"} onPress={async () => await stopScan()} />
                </TouchableOpacity>
            </View>
        </>
    )


}

export default BluetoothDeviceScan;