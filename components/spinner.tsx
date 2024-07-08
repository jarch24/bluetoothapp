import { ActivityIndicator, StyleSheet } from "react-native"




const Spinner = () => {
    const styles = StyleSheet.create({
        spinner: {
            position: "absolute",
            alignItems: "center",
            justifyContent: 'center',
            left:0,
            top: 4,
            right:0,
            bottom: 0
        }});
    return <ActivityIndicator style={styles.spinner} color={"#00ff00"} size={"large"}/>
}

export default Spinner;