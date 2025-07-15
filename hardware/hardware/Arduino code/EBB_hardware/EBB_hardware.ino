#include <WiFiS3.h> // For Arduino Uno R4 WiFi networking
#include <Wire.h>
#include <ArduinoJson.h>
#include "config.h"
#include "sensors.h"
#include "actuators.h"
#include "wifi_utils.h"

// Timing for server polling and sensor data sending
unsigned long lastActuatorCheck = 0;
unsigned long lastSensorDataSent = 0;
const unsigned long actuatorCheckInterval = 500;
const unsigned long sensorDataInterval = 300; 
String authToken = "";
bool isAuthenticated = false;

WiFiClient actuatorClient;
WiFiClient sensorClient;

// Function prototypes
void fetchActuatorUpdates();
// void sendSensorDataToServer();
void sendBatchedSensorDataToServer();
void controlActuatorsAutomatically();
String generateSingleSensorPayload(const char* sensorType, float value);
void sendToServer(String payload);

void setup() {
    Serial.begin(9600);
    delay(1000);

    connectToWiFi();
    if (!authenticate()) {
        Serial.println("Initial authentication failed. Check your credentials.");
    } else {
    isAuthenticated = true;
    }

    initSensors();
    initActuators();
}

void loop() {
    unsigned long currentMillis = millis();

    // Fetch actuator updates at regular intervals
    if (currentMillis - lastActuatorCheck >= actuatorCheckInterval) {
        lastActuatorCheck = currentMillis;
        fetchActuatorUpdates();
    }

    // Send sensor data at regular intervals
    if (currentMillis - lastSensorDataSent >= sensorDataInterval) {
        lastSensorDataSent = currentMillis;
        // sendSensorDataToServer();
        sendBatchedSensorDataToServer();
    }

    // Control actuators automatically based on sensor readings
    controlActuatorsAutomatically();
}

// Fetch actuator updates from the server
void fetchActuatorUpdates() {
    if (!isAuthenticated || authToken == "") {
        Serial.println("Re-authenticating...");
        if (!authenticate()) {
            Serial.println("Auth failed. Skipping actuator update.");
            return;
        }
        isAuthenticated = true;
    }

    if (!actuatorClient.connect(SERVER_IP, SERVER_PORT)) {
        Serial.println("Failed to connect to server for actuator updates.");
        return;
    }

    actuatorClient.setTimeout(5000);

    actuatorClient.println("GET /actuators/api/actuator/status HTTP/1.1");
    actuatorClient.println("Host: " + String(SERVER_IP));
    addAuthHeader(actuatorClient);
    actuatorClient.println("Connection: close");
    actuatorClient.println();

    // Wait for headers
    unsigned long timeout = millis();
    while (actuatorClient.available() == 0) {
        if (millis() - timeout > 5000) {
            Serial.println("Timeout waiting for actuator data.");
            actuatorClient.stop();
            return;
        }
    }

    // Skip HTTP headers
    while (actuatorClient.available()) {
        String line = actuatorClient.readStringUntil('\n');
        if (line == "\r") break;
    }

    // Read body
    String response = "";
    while (actuatorClient.available()) {
        char c = actuatorClient.read();
        response += c;
    }
    actuatorClient.stop();

    Serial.println("Received Actuator Updates:");
    Serial.println(response);

    StaticJsonDocument<512> jsonDoc;
    DeserializationError error = deserializeJson(jsonDoc, response);
    if (error) {
        Serial.print("JSON Parsing failed: ");
        Serial.println(error.c_str());
        return;
    }

    for (JsonObject actuator : jsonDoc.as<JsonArray>()) {
        const char* name = actuator["actuator"];
        const char* mode = actuator["mode"];
        const char* status = actuator["status"];
        int intensity = actuator["intensity"] | 0;

        updateActuator(name, mode, status, intensity);
    }
}

// Define the URL
const char* thresholdEndpoint = "/api/actuators/thresholds";

// Struct to hold thresholds
struct Thresholds {
  float tempMin, tempMax;
  float humidityMin, humidityMax;
  int soilMin, soilMax;
  int lightMin, lightMax;
} thresholds;

bool fetchThresholdsFromServer() {
  WiFiClient thresholdClient;

  if (authToken == "") return false;

  if (!thresholdClient.connect(SERVER_IP, SERVER_PORT)) {
    Serial.println("Failed to connect for thresholds");
    return false;
  }

  thresholdClient.println("GET " + String(thresholdEndpoint) + " HTTP/1.1");
  thresholdClient.println("Host: " + String(SERVER_IP));
  addAuthHeader(thresholdClient);
  thresholdClient.println("Connection: close");
  thresholdClient.println();

  // Skip headers
  while (thresholdClient.connected()) {
    String line = thresholdClient.readStringUntil('\n');
    if (line == "\r") break;
  }

  String response = thresholdClient.readString();
  Serial.println("Thresholds response: " + response);

  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, response);
  if (error) {
    Serial.print("Failed to parse thresholds: ");
    Serial.println(error.c_str());
    return false;
  }

  thresholds.tempMin = doc["temperature"][0];
  thresholds.tempMax = doc["temperature"][1];
  thresholds.humidityMin = doc["humidity"][0];
  thresholds.humidityMax = doc["humidity"][1];
  thresholds.soilMin = doc["soil_moisture"][0];
  thresholds.soilMax = doc["soil_moisture"][1];
  thresholds.lightMin = doc["light"][0];
  thresholds.lightMax = doc["light"][1];

  return true;
}

// Generate a single sensor payload
String generateSingleSensorPayload(const char* sensorType, float value) {
    StaticJsonDocument<128> sensorDataDoc; 
    sensorDataDoc["sensor_type"] = sensorType;
    sensorDataDoc["value"] = value;

    // Serialize JSON document to a string
    String payload;
    serializeJson(sensorDataDoc, payload);

    return payload; 
}

// Send sensor data to the server
// void sendSensorDataToServer() {
//     if (authToken == "") {
//         Serial.println("No auth token available. Authenticating...");
//         if (!authenticate()) {
//             Serial.println("Authentication failed. Skipping sensor data send.");
//             return;
//         }
//     }

//     // Light Sensor (TSL2561)
//     sensors_event_t lightEvent;
//     tsl.getEvent(&lightEvent);
//     float lightLevel = (lightEvent.light >= 0) ? lightEvent.light : -1;
//     sendToServer(generateSingleSensorPayload("TSL2561", lightLevel));

//     // Temperature Sensor (BME280)
//     float temperature = bme.readTemperature();
//     sendToServer(generateSingleSensorPayload("BME280_Temperature", !isnan(temperature) ? temperature : -1));

//     // Humidity Sensor (BME280)
//     float humidity = bme.readHumidity();
//     sendToServer(generateSingleSensorPayload("BME280_Humidity", !isnan(humidity) ? humidity : -1));

//     // Pressure Sensor (BME280)
//     float pressure = bme.readPressure() / 100.0F; // Convert to hPa
//     sendToServer(generateSingleSensorPayload("BME280_Pressure", !isnan(pressure) ? pressure : -1));

//     // Soil Moisture Sensor
//     int soilMoisture = analogRead(moisturePin);
//     sendToServer(generateSingleSensorPayload("SoilMoisture", (soilMoisture >= 0) ? soilMoisture : -1));

//     // Distance Sensor (HC-SR04)
//     digitalWrite(trigPin, LOW);
//     delayMicroseconds(2);
//     digitalWrite(trigPin, HIGH);
//     delayMicroseconds(10);
//     digitalWrite(trigPin, LOW);
//     long duration = pulseIn(echoPin, HIGH);
//     float distance = (duration > 0) ? (duration * 0.034 / 2) : -1;
//     sendToServer(generateSingleSensorPayload("HC-SR04_Distance", distance));
// }

// Function to send a payload to the server
void sendToServer(String payload) {
    if (sensorClient.connect(SERVER_IP, SERVER_PORT)) {
        sensorClient.println("POST /sensors/api/sensor HTTP/1.1");
        sensorClient.println("Host: " + String(SERVER_IP));
        addAuthHeader(sensorClient);
        sensorClient.println("Content-Type: application/json");
        sensorClient.println("Content-Length: " + String(payload.length()));
        sensorClient.println("Connection: close");
        sensorClient.println();
        sensorClient.println(payload);

        unsigned long timeout = millis();
        while (sensorClient.connected() && !sensorClient.available()) {
            if (millis() - timeout > 2000) {
                Serial.println("Timeout waiting for sensor response");
                sensorClient.stop();
                return;
            }
        }

        while (sensorClient.available()) {
            sensorClient.read(); // Skip response
        }

        sensorClient.stop();
        Serial.println("Payload sent successfully: " + payload);
    } else {
        Serial.println("Connection to server failed when sending payload.");
    }
}

void sendBatchedSensorDataToServer() {
  //  force updates every 3 seconds even if unchanged
  // static unsigned long lastSent = 0;
  // if (millis() - lastSent < 3000 && no change) return;
  // lastSent = millis();

    static float prevLight = -999;
    static float prevTemp = -999;
    static float prevHumidity = -999;
    static float prevPressure = -999;
    static int prevSoil = -999;
    static float prevDistance = -999;

    // Read sensors
    sensors_event_t lightEvent;
    tsl.getEvent(&lightEvent);
    float lightLevel = lightEvent.light;

    float temperature = bme.readTemperature();
    float humidity = bme.readHumidity();
    float pressure = bme.readPressure() / 100.0F;
    int soilMoisture = analogRead(moisturePin);

    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);
    float duration = pulseIn(echoPin, HIGH);
    float distance = (duration > 0) ? (duration * 0.0343 / 2) : -1;

    // Skip update if all values are the same (± tolerance)
    if (
        abs(lightLevel - prevLight) < 1.0 &&
        abs(temperature - prevTemp) < 0.1 &&
        abs(humidity - prevHumidity) < 0.1 &&
        abs(pressure - prevPressure) < 0.1 &&
        abs(soilMoisture - prevSoil) < 2 &&
        abs(distance - prevDistance) < 0.5
    ) {
        return; // No significant change, skip POST
    }

    // Update previous values
    prevLight = lightLevel;
    prevTemp = temperature;
    prevHumidity = humidity;
    prevPressure = pressure;
    prevSoil = soilMoisture;
    prevDistance = distance;

    // Pack into a single JSON
    StaticJsonDocument<256> doc;
    doc["TSL2561"] = lightLevel;
    doc["BME280_Temperature"] = temperature;
    doc["BME280_Humidity"] = humidity;
    doc["BME280_Pressure"] = pressure;
    doc["SoilMoisture"] = soilMoisture;
    doc["HC_SR04_Distance"] = distance;

    String payload;
    serializeJson(doc, payload);
    sendToServer(payload);  // Existing function
}

// Automatically control actuators based on sensor readings
void controlActuatorsAutomatically() {
  // Light Control
  sensors_event_t lightEvent;
  tsl.getEvent(&lightEvent);
  float lightLevel = lightEvent.light;
  if (lightMode == AUTO) {
    digitalWrite(lightRelayPin, (lightLevel < thresholds.lightMin) ? LOW : HIGH);
  }

  // Temp Control
  float temp = bme.readTemperature();
  if (fanMode == AUTO) {
    digitalWrite(fanRelayPin, (temp > thresholds.tempMax) ? LOW : HIGH);
  }

  // Soil Moisture Control
  int soil = analogRead(moisturePin);
  if (pumpMode == AUTO) {
    digitalWrite(pumpRelayPin, (soil < thresholds.soilMin) ? LOW : HIGH);
  }
}
