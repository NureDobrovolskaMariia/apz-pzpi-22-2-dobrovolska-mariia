#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// MQTT Configuration
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* mqtt_user = "";
const char* mqtt_pass = "";

// Device Configuration - Format: YYYYMMDD-userId-3RandomSymbols
const char* device_id = "20250530-683978da0599b30915bcad96-6yd";
const char* user_id = "683978da0599b30915bcad96";
const char* device_type = "chicken_incubator";

// MQTT Topics - now user-specific
String topic_sensor_data = "incubator/user/" + String(user_id) + "/sensor/data";
String topic_device_status = "incubator/user/" + String(user_id) + "/device/status";
String topic_commands = "incubator/user/" + String(user_id) + "/device/commands";
String topic_alerts = "incubator/user/" + String(user_id) + "/alerts";

// Pin Configuration
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define LIGHT_SENSOR_PIN 34
#define HEATER_RELAY_PIN 25
#define HUMIDIFIER_RELAY_PIN 26
#define FAN_RELAY_PIN 27
#define TURNER_RELAY_PIN 33
#define BUZZER_PIN 32

// Component Initialization
DHT dht(DHT_PIN, DHT_TYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);
WiFiClient espClient;
PubSubClient client(espClient);

// Sensor Variables
float temperature = 0;
float humidity = 0;
int lightLevel = 0;
bool heaterStatus = false;
bool humidifierStatus = false;
bool fanStatus = false;
bool turnerStatus = false;

// Incubation Settings (can be updated via MQTT)
float targetTemperature = 37.5;  // °C for chicken eggs
float targetHumidity = 60.0;     // % for first 18 days
float temperatureTolerance = 0.5;
float humidityTolerance = 5.0;
bool autoMode = true;
bool turningEnabled = true;
unsigned long turningInterval = 3600000; // 1 hour in milliseconds

// Timing Variables
unsigned long lastSensorRead = 0;
unsigned long lastMqttSend = 0;
unsigned long lastDisplayUpdate = 0;
unsigned long lastTurning = 0;
unsigned long lastHeartbeat = 0;

// Intervals
const unsigned long sensorInterval = 5000;     // Read sensors every 5 seconds
const unsigned long mqttInterval = 30000;      // Send MQTT every 30 seconds
const unsigned long displayInterval = 2000;    // Update display every 2 seconds
const unsigned long heartbeatInterval = 60000; // Heartbeat every minute

// Alert system
bool temperatureAlert = false;
bool humidityAlert = false;
bool deviceOfflineAlert = false;

void setup() {
  Serial.begin(115200);
  Serial.println("Initializing Chicken Incubator System...");
  Serial.println("Device ID: " + String(device_id));
  Serial.println("User ID: " + String(user_id));
  
  // Initialize pins
  pinMode(HEATER_RELAY_PIN, OUTPUT);
  pinMode(HUMIDIFIER_RELAY_PIN, OUTPUT);
  pinMode(FAN_RELAY_PIN, OUTPUT);
  pinMode(TURNER_RELAY_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Initialize all relays to OFF
  digitalWrite(HEATER_RELAY_PIN, LOW);
  digitalWrite(HUMIDIFIER_RELAY_PIN, LOW);
  digitalWrite(FAN_RELAY_PIN, LOW);
  digitalWrite(TURNER_RELAY_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  
  // Initialize DHT22
  dht.begin();
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Incubator Init..");
  
  // Connect to WiFi
  setupWiFi();
  
  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
  
  Serial.println("Chicken Incubator System Ready!");
  Serial.println("Topics:");
  Serial.println("- Data: " + topic_sensor_data);
  Serial.println("- Status: " + topic_device_status);
  Serial.println("- Commands: " + topic_commands);
  lcd.clear();
  
  // Send initial status
  sendDeviceStatus();
}

void setupWiFi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  lcd.setCursor(0, 1);
  lcd.print("WiFi connecting");
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  lcd.setCursor(0, 1);
  lcd.print("WiFi OK         ");
  delay(1000);
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message received [");
  Serial.print(topic);
  Serial.print("]: ");
  
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);
  
  // Parse commands only if it's for this user
  if (String(topic) == topic_commands) {
    parseCommand(message);
  }
}

void parseCommand(String command) {
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, command);
  
  if (error) {
    Serial.print("JSON parsing failed: ");
    Serial.println(error.c_str());
    return;
  }
  
  // Check if command is for this device
  if (doc.containsKey("device_id") && doc["device_id"] != device_id) {
    Serial.println("Command not for this device, ignoring");
    return;
  }
  
  // Update settings
  if (doc.containsKey("target_temperature")) {
    targetTemperature = doc["target_temperature"];
    Serial.printf("Target temperature updated: %.1f°C\n", targetTemperature);
  }
  
  if (doc.containsKey("target_humidity")) {
    targetHumidity = doc["target_humidity"];
    Serial.printf("Target humidity updated: %.1f%%\n", targetHumidity);
  }
  
  if (doc.containsKey("auto_mode")) {
    autoMode = doc["auto_mode"];
    Serial.printf("Auto mode: %s\n", autoMode ? "ON" : "OFF");
  }
  
  if (doc.containsKey("turning_enabled")) {
    turningEnabled = doc["turning_enabled"];
    Serial.printf("Turning: %s\n", turningEnabled ? "ON" : "OFF");
  }
  
  // Manual control commands
  if (doc.containsKey("heater")) {
    if (!autoMode) {
      heaterStatus = doc["heater"];
      digitalWrite(HEATER_RELAY_PIN, heaterStatus ? HIGH : LOW);
    }
  }
  
  if (doc.containsKey("humidifier")) {
    if (!autoMode) {
      humidifierStatus = doc["humidifier"];
      digitalWrite(HUMIDIFIER_RELAY_PIN, humidifierStatus ? HIGH : LOW);
    }
  }
  
  if (doc.containsKey("turn_eggs")) {
    if (doc["turn_eggs"] == true) {
      turnEggs();
    }
  }
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    if (client.connect(device_id, mqtt_user, mqtt_pass)) {
      Serial.println("connected");
      // Subscribe to user-specific command topic
      client.subscribe(topic_commands.c_str());
      Serial.println("Subscribed to: " + topic_commands);
      sendDeviceStatus();
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retry in 5 seconds");
      delay(5000);
    }
  }
}

void readSensors() {
  // Read DHT22
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  
  if (!isnan(h) && !isnan(t)) {
    humidity = h;
    temperature = t;
  }
  
  // Read light sensor
  lightLevel = analogRead(LIGHT_SENSOR_PIN);
  
  // Check for alerts
  checkAlerts();
  
  Serial.println("=== Sensor Data ===");
  Serial.printf("Temperature: %.1f°C (Target: %.1f°C)\n", temperature, targetTemperature);
  Serial.printf("Humidity: %.1f%% (Target: %.1f%%)\n", humidity, targetHumidity);
  Serial.printf("Light Level: %d\n", lightLevel);
  Serial.println("==================");
}

void checkAlerts() {
  // Temperature alert
  bool tempAlert = abs(temperature - targetTemperature) > temperatureTolerance;
  if (tempAlert != temperatureAlert) {
    temperatureAlert = tempAlert;
    if (temperatureAlert) {
      sendAlert("TEMPERATURE", "Temperature out of range", "HIGH");
      soundAlarm();
    }
  }
  
  // Humidity alert
  bool humAlert = abs(humidity - targetHumidity) > humidityTolerance;
  if (humAlert != humidityAlert) {
    humidityAlert = humAlert;
    if (humidityAlert) {
      sendAlert("HUMIDITY", "Humidity out of range", "HIGH");
      soundAlarm();
    }
  }
}

void soundAlarm() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    delay(200);
  }
}

void controlEnvironment() {
  if (!autoMode) return;
  
  // Temperature control
  if (temperature < targetTemperature - temperatureTolerance) {
    if (!heaterStatus) {
      heaterStatus = true;
      digitalWrite(HEATER_RELAY_PIN, HIGH);
      Serial.println("Heater ON");
    }
  } else if (temperature > targetTemperature + temperatureTolerance) {
    if (heaterStatus) {
      heaterStatus = false;
      digitalWrite(HEATER_RELAY_PIN, LOW);
      Serial.println("Heater OFF");
    }
  }
  
  // Humidity control
  if (humidity < targetHumidity - humidityTolerance) {
    if (!humidifierStatus) {
      humidifierStatus = true;
      digitalWrite(HUMIDIFIER_RELAY_PIN, HIGH);
      Serial.println("Humidifier ON");
    }
  } else if (humidity > targetHumidity + humidityTolerance) {
    if (humidifierStatus) {
      humidifierStatus = false;
      digitalWrite(HUMIDIFIER_RELAY_PIN, LOW);
      Serial.println("Humidifier OFF");
    }
  }
  
  // Fan control (always on for air circulation)
  if (!fanStatus) {
    fanStatus = true;
    digitalWrite(FAN_RELAY_PIN, HIGH);
  }
}

void turnEggs() {
  if (!turningEnabled) return;
  
  Serial.println("Turning eggs...");
  turnerStatus = true;
  digitalWrite(TURNER_RELAY_PIN, HIGH);
  delay(5000); // Turn for 5 seconds
  digitalWrite(TURNER_RELAY_PIN, LOW);
  turnerStatus = false;
  
  lastTurning = millis();
  Serial.println("Eggs turned");
}

void updateDisplay() {
  // First line - temperature and humidity
  lcd.setCursor(0, 0);
  lcd.printf("T:%.1fC H:%.1f%%", temperature, humidity);
  
  // Second line - status
  lcd.setCursor(0, 1);
  String status = "";
  if (heaterStatus) status += "H";
  if (humidifierStatus) status += "M";
  if (fanStatus) status += "F";
  if (turnerStatus) status += "T";
  
  lcd.printf("%-6s", status.c_str());
  
  // Connection status
  if (WiFi.status() != WL_CONNECTED) {
    lcd.print("NoWiFi");
  } else if (!client.connected()) {
    lcd.print("NoMQTT");
  } else {
    //lcd.print("Online");
  }
}

void sendSensorData() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  
  // Use smaller JSON with shorter field names for efficiency
  DynamicJsonDocument doc(512);
  doc["id"] = device_id;
  doc["uid"] = user_id;
  doc["type"] = device_type;
  doc["t"] = millis();
  doc["temp"] = temperature;
  doc["hum"] = humidity;
  doc["light"] = lightLevel;
  doc["target_temp"] = targetTemperature;
  doc["target_hum"] = targetHumidity;
  doc["heater"] = heaterStatus;
  doc["humidifier"] = humidifierStatus;
  doc["fan"] = fanStatus;
  doc["turner"] = turnerStatus;
  doc["auto"] = autoMode;
  doc["rssi"] = WiFi.RSSI();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("📤 Sending to: " + topic_sensor_data);
  Serial.println("📄 JSON: " + jsonString);
  Serial.println("📏 Length: " + String(jsonString.length()) + " bytes");
  
  bool result = client.publish(topic_sensor_data.c_str(), jsonString.c_str());
  
  if (result) {
    Serial.println("✅ Sensor data sent successfully!");
  } else {
    Serial.println("❌ Failed to send sensor data");
    Serial.println("🔍 MQTT State: " + String(client.state()));
  }
}

void sendDeviceStatus() {
  DynamicJsonDocument doc(256);
  doc["id"] = device_id;
  doc["uid"] = user_id;
  doc["type"] = device_type;
  doc["status"] = "online";
  doc["fw"] = "1.0.0";
  doc["ip"] = WiFi.localIP().toString();
  doc["uptime"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  client.publish(topic_device_status.c_str(), jsonString.c_str());
  Serial.println("📡 Device status sent");
}

void sendAlert(String type, String message, String severity) {
  DynamicJsonDocument doc(256);
  doc["id"] = device_id;
  doc["uid"] = user_id;
  doc["alert_type"] = type;
  doc["message"] = message;
  doc["severity"] = severity;
  doc["t"] = millis();
  doc["temp"] = temperature;
  doc["hum"] = humidity;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  client.publish(topic_alerts.c_str(), jsonString.c_str());
  Serial.printf("🚨 Alert sent: %s - %s\n", type.c_str(), message.c_str());
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();
  
  unsigned long currentTime = millis();
  
  // Read sensors
  if (currentTime - lastSensorRead >= sensorInterval) {
    readSensors();
    controlEnvironment();
    lastSensorRead = currentTime;
  }
  
  // Update display
  if (currentTime - lastDisplayUpdate >= displayInterval) {
    updateDisplay();
    lastDisplayUpdate = currentTime;
  }
  
  // Send MQTT data
  if (currentTime - lastMqttSend >= mqttInterval) {
    sendSensorData();
    lastMqttSend = currentTime;
  }
  
  // Send heartbeat
  if (currentTime - lastHeartbeat >= heartbeatInterval) {
    sendDeviceStatus();
    lastHeartbeat = currentTime;
  }
  
  // Auto egg turning
  if (turningEnabled && autoMode && 
      (currentTime - lastTurning >= turningInterval)) {
    turnEggs();
  }
  
  delay(100);
}