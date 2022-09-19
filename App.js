import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import Vdetails from "./components/Vdetails";
import SVdetails from "./components/SVdetails";
import Toggle from "react-native-toggle-element";
import { TextInput, Button, Snackbar } from "react-native-paper";
import { Camera } from "expo-camera";
import * as SQLite from "expo-sqlite";
const db = SQLite.openDatabase("db.boombarrier");

function HomeScreen() {
  const opened = "Opened",
    closed = "Closed";
  const [vehiclenumber, onChangeNumber] = React.useState(null);
  const [operation_type, setoperation_type] = useState("NA");
  const [togglestatus, settogglestatus] = useState("NA");
  // toggle btn
  const [toggleValue, setToggleValue] = useState(false);
  const [isShown, setisShown] = useState(false);
  var [respMsg, setRespMsg] = useState("Response");
  var [currentStatus, setCurrentStatus] = useState("Current Status");
  // snackbar
  const [snackbar, setSnackbar] = React.useState(false);
  const onToggleSnackBar = () => setSnackbar(!snackbar);
  const onDismissSnackBar = () => setSnackbar(false);
  // input buttons
  const [checked, setChecked] = useState(0);
  const [purposechecked, setpurposechecked] = useState(0);
  var items = ["Inward", "Outward", "Store", "Visitor", "Project"];
  var purposeitems = ["In", "Out"];
  // camera
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [camera, setCamera] = useState(null);
  const [image, setImage] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  // date time set
  let date = new Date().getDate().toString().padStart(2, "0");
  let month = (1 + new Date().getMonth()).toString().padStart(2, "0");
  let year = new Date().getFullYear();
  let hours = new Date().getHours();
  let min = new Date().getMinutes();
  let sec = new Date().getSeconds();

  db.transaction(function (txn) {
    txn.executeSql(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='vdetails'",
      [],
      function (tx, res) {
        // console.log("item:", res.rows.length);
        // txn.executeSql("ALTER TABLE vdetails RENAME COLUMN vechile_type TO vehicle_type");
        // txn.executeSql("ALTER TABLE vdetails RENAME COLUMN vechile_number TO vehicle_number");
        if (res.rows.length == 0) {
          txn.executeSql("DROP TABLE IF EXISTS vdetails", []);
          txn.executeSql(
            "CREATE TABLE IF NOT EXISTS vdetails(operation_id INTEGER PRIMARY KEY AUTOINCREMENT,date DATE,time VARCHAR(30), vehicle_type VARCHAR(30), vehicle_number VARCHAR(30), purpose VARCHAR(255),operation_mode VARCHAR(50), operation_type VARCHAR(50))",
            []
          );
        }
      }
    );
  });
  const saveData = async () => {
    const currentdate = date + "/" + month + "/" + year;
    const currenttime = hours + ":" + min + ":" + sec;
    // console.log("Date:",currentdate,"time:",currenttime,"cartype:",items[checked],"carno:",vehiclenumber,
    //   "purpose:",purposeitems[purposechecked],"operationmode:",togglestatus,"operation_type:",operation_type
    // );
    if (vehiclenumber==null ||(vehiclenumber!=null && vehiclenumber.trim().length == 0)) {
      setRespMsg("Please enter Vehicle Number.");
      return;
    }
    try {
      db.transaction((tx) => {
        tx.executeSql(
          'INSERT INTO vdetails (date, time, vehicle_type, vehicle_number, purpose, operation_mode,  operation_type) VALUES ("' +
            currentdate +
            '", "' +
            currenttime +
            '","' +
            items[checked] +
            '","' +
            vehiclenumber +
            '","' +
            purposeitems[purposechecked] +
            '","' +
            togglestatus +
            '","' +
            operation_type +
            '")'
        ),
          (txObj, resultSet) => console.log("data", resultSet),
          (txObj, error) => console.log("Error", error);
        setCurrentStatus("Data Saved Successfully");
        onToggleSnackBar();
      });
    } catch (error) {
      setCurrentStatus("Sorry! Data is not saved.");
      onToggleSnackBar();
    }
  };
  const fetchData = () => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM vdetails",
        null,
        (txObj, { rows: { _array } }) => console.log(_array),
        (txObj, error) => console.log("Error ", error)
      );
    });
  };
  const deleteitem = (id) => {
    db.transaction((tx) => {
      tx.executeSql(
        "DELETE FROM vdetails WHERE operation_id = " + id,
        (txObj, resultSet) => {
          if (resultSet.rowsAffected > 0) {
            let newList = this.state.data.filter((data) => {
              if (data.id === id) return false;
              else return true;
            });
            this.setState({ data: newList });
          }
        }
      );
    });
  };
  const clickManual = async () => {
    setoperation_type("Manual");
    // settogglestatus("Open");
    if (toggleValue == true) {
      setRespMsg("Opened Manually");
    } else {
      setRespMsg("Closed Manually");
    }
    saveData();
    setisShown(false);
    // deleteitem(8);
    // fetchData();
  };
  // open close button functions
  const callOpen = async () => {
    setRespMsg("");
    try {
      const response = await fetch("http://192.168.0.8/open");
      const json = await response.json();
      if (json.message == opened) {
        setRespMsg("Opened successfully");
        setoperation_type("Auto");
        settogglestatus("Open");
        saveData();
      } else {
        setToggleValue(true);
        setRespMsg("Opening error");
        setisShown(true);
      }
    } catch (error) {
      setRespMsg("Opening failed");
      setToggleValue(true);
      setisShown(true);
      // refresh();
    }
  };
  const callClose = async () => {
    setRespMsg("");
    try {
      const response = await fetch("http://192.168.0.8/close");
      const json = await response.json();
      if (json.message == closed) {
        setRespMsg("Closed Successfully");
        setoperation_type("Auto");
        settogglestatus("Close");
        saveData();
      } else {
        setToggleValue(false);
        setRespMsg("Closing error");
        setisShown(true);
      }
    } catch (error) {
      setToggleValue(false);
      setRespMsg("Closing failed");
      setisShown(true);
      // refresh();
    }
  };
  const refresh = async () => {
    try {
      const response = await fetch("http://192.168.0.8/status");
      const json = await response.json();
      if (json) {
        setCurrentStatus("Conneted Successfully");
        if (json.message == opened) {
          setToggleValue(true);
          setRespMsg(json.message);
          onToggleSnackBar();
        } else if (json.message == closed) {
          setToggleValue(false);
          setRespMsg(json.message);
          onToggleSnackBar();
        } else {
          setToggleValue(true);
          setRespMsg(json.message);
          onToggleSnackBar();
        }
      } else {
        setCurrentStatus("Response not found");
        onToggleSnackBar();
      }
    } catch (error) {
      setCurrentStatus("No communication with device.");
      onToggleSnackBar();
    }
  };
  const changeStatus = () => {
    if (toggleValue) {
      settogglestatus("Close");
      callClose();
    } else {
      settogglestatus("Open");
      callOpen();
    }
  };
  //camera
  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === "granted");
      // console.log("data");
    })();
  }, []);
  
  const takePicture = async () => {
    if (camera) {
      const data = await camera.takePictureAsync(null);
      setImage(data.uri);
    }
  };
  //camera
  return (
    <View style={styles.scrollcontainer}>
      <ScrollView>
        <View style={{ alignItems: "center" }}>
          {/* vehicle type */}
          <View>
            <View style={styles.btn}>
              {items.map((items, key) => {
                return (
                  <View key={items}>
                    {checked == key ? (
                      <TouchableOpacity style={styles.radio}>
                        <Text style={{ color: "#0360a6", fontWeight: "bold" }}>
                          {items}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          setChecked(key);
                        }}
                        style={styles.radio2}
                      >
                        <Text
                          style={{ color: "whitesmoke", fontWeight: "bold" }}
                        >
                          {items}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
          {/* camera start */}
          <View
            style={{ flexDirection: "row", marginTop: 10, marginBottom: 10 }}
          >
            <View style={styles.containercamera}>
              <Camera
                ref={(ref) => setCamera(ref)}
                style={styles.fixedRatio}
                type={type}
                //ratio={'1:1'}
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                backgroundColor: "whitesmoke",
                borderWidth: 1,
                borderColor: "#0360a6",
              }}
            >
              <View>
                <Button
                  onPress={() => takePicture()}
                  icon="camera"
                  style={{
                    backgroundColor: "#ffc226",
                    borderRadius: 0,
                  }}
                  color="#0360a6"
                >
                  Take Picture
                </Button>
                {image && (
                  <Image
                    source={{ uri: image }}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: "#0360a6",
                      backgroundColor: "whitesmoke",
                    }}
                  />
                )}
              </View>
            </View>
          </View>

          {/* vehicle number */}
          <TextInput
            label="Enter Vehicle Number"
            style={styles.input}
            onChangeText={onChangeNumber}
            value={vehiclenumber}
            selectionColor="#0360a6"
            outlineColor="#0360a6"
            activeUnderlineColor="#0360a6"
            mode="flat"
            autoCapitalize="characters"
            keyboardType="ascii-capable"
            right={<TextInput.Icon icon="car-lifted-pickup" color="#362703" />}
          />
          {/* in out buttons */}
          <View style={{ marginBottom: 30, marginTop: 10 }}>
            <View style={styles.btn}>
              {purposeitems.map((purposeitems, key) => {
                return (
                  <View key={purposeitems}>
                    {purposechecked == key ? (
                      <Button color="white" icon="import" style={styles.radio3}>
                        <Text style={styles.radiotext}>{purposeitems}</Text>
                      </Button>
                    ) : (
                      <Button
                        color="white"
                        icon="export"
                        onPress={() => {
                          setpurposechecked(key);
                        }}
                        style={styles.radio4}
                      >
                        <Text style={styles.radiotext}>{purposeitems}</Text>
                      </Button>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* refresh button */}
          <View>
            <Button
              style={styles.generalBtn}
              icon="refresh"
              mode="contained"
              onPress={refresh}
              color="#CEE5D0"
            >
              refresh
            </Button>
          </View>
          <View style={{ margin: 20, alignItems: "center" }}>
            <View>
              <Toggle
                value={toggleValue}
                onPress={(newState) => {
                  setToggleValue(newState);
                  changeStatus();
                }}
                leftTitle="Close"
                rightTitle="Open"
                trackBar={{
                  width: 300,
                  height: 50,
                  radius: 25,
                  activeBackgroundColor: "#CEE5D0",
                  inActiveBackgroundColor: "#FFC090",
                }}
                thumbButton={{
                  width: 60,
                  height: 60,
                  radius: 30,
                }}
                thumbStyle={{ backgroundColor: "#FF1E00" }}
              />
              {isShown ? (
                <View
                  style={{
                    marginBottom: 10,
                    marginTop: 10,
                    width: 200,
                    alignSelf: "center",
                  }}
                >
                  <Button
                    color="#ffc226"
                    style={styles.generalBtn}
                    icon="gesture-tap-button"
                    mode="contained"
                    onPress={clickManual}
                  >
                    Operate Manually
                  </Button>
                </View>
              ) : null}
              <Text style={styles.respMsg}>{respMsg}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <Snackbar
        duration={2000}
        visible={snackbar}
        onDismiss={onDismissSnackBar}
      >
        {currentStatus}
      </Snackbar>
    </View>
  );
}
function LogoTitle() {
  return (
    <View style={{ flex: 1, flexDirection: "row" }}>
      <View>
        <Image
          style={{ width: 50, height: 50 }}
          source={require("./assets/icon.png")}
        />
      </View>
      <View style={{ justifyContent: "center" }}>
        <Text
          style={{
            fontSize: 20,
            alignSelf: "center",
            color: "black",
            textShadowColor: "rgba(255,255,255, 0.25)",
            textShadowOffset: { width: 1, height: 0 },
            textShadowRadius: 1,
            fontWeight: "bold",
          }}
        >
          Boom Barrier
        </Text>
      </View>
    </View>
  );
}
const Tab = createBottomTabNavigator();
function MyTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: "#ffc226",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerTitle: () => <LogoTitle />,
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Boom Barrier") {
            iconName = "home-sharp";
          } else if (route.name === "Vehicle Search") {
            iconName = "search-sharp";
          } else if (route.name === "In/out Status") {
            iconName = "ios-list";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#ffc226",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Boom Barrier" component={HomeScreen} />
      <Tab.Screen name="Vehicle Search" component={Vdetails} />
      <Tab.Screen name="In/out Status" component={SVdetails} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <MyTabs />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  scrollcontainer: {
    flex: 1,
    backgroundColor: "#fcfcfc",
    paddingTop: 10,
  },
  input: {
    width: "90%",
    padding: 0,
    borderRadius: 0,
    fontWeight: "600",
    backgroundColor: "rgba(255, 194, 38,.4)",
    fontWeight: "bold",
  },
  headings: {
    color: "gray",
    fontWeight: "normal",
    backgroundColor: "transparent",
    fontSize: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 100,
    alignItems: "center",
    marginTop: 5,
    marginBottom: 5,
  },
  text: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "bold",
    letterSpacing: 0.25,
    color: "white",
  },
  Switch: {
    margin: 1,
  },
  generalBtn: {
    marginTop: 10,
    padding: 2,
    borderRadius: 0,
  },
  cameraContainer: {
    flex: 1,
    height: 20,
    width: 50,
    borderColor: "#0360a6",
    borderWidth: 1,
    flexDirection: "row",
  },
  fixedRatio: {
    flex: 1,
    aspectRatio: 2,
  },
  containercamera: {
    margin: 0,
    borderColor: "#0360a6",
    borderWidth: 1,
    height: 90,
    width: 170,
    backgroundColor: "blue",
  },
  respMsg: {
    marginTop: 30,
    paddingTop: 30,
    paddingBottom: 30,
    backgroundColor: "#FFF5E4",
    color: "black",
    textAlign: "center",
    fontWeight: "bold",
    borderStyle: "solid",
    borderWidth:4,
    borderColor:'white',
    shadowColor: "#FFC4C4",
    shadowOffset: {
      width: 4,
      height: 5,
    },
    shadowOpacity: 0.9,
    shadowRadius: 2,
    elevation: 10,
    textShadowColor: "rgba(255,255,255, 0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    margin: 0,
    backgroundColor: "transparent",
    fontWeight: "bold",
  },
  radio: {
    backgroundColor: "#ffc226",
    padding: 10,
    width: 70,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#0360a6",
    fontWeight: "bold",
  },
  radio2: {
    width: 70,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0360a68a",
    borderRadius: 50,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "transparent",
    color: "#0360a6",
    fontWeight: "bold",
  },

  radio3: {
    width: 100,
    justifyContent: "center",
    alignpurposeitems: "center",
    marginRight: 10,
    borderRadius: 100,
    borderStyle: "solid",
    backgroundColor: "#ffc226",
  },

  radio4: {
    width: 100,
    justifyContent: "center",
    alignpurposeitems: "center",
    marginRight: 10,
    borderRadius: 100,
    backgroundColor: "#0360a673",
    borderStyle: "solid",
  },
  radiotext: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
});
