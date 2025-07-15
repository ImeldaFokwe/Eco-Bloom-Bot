#ifndef SENSORS_H
#define SENSORS_H

#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_TSL2561_U.h>
#include <Adafruit_BME280.h>
#include <ArduinoJson.h>

// Sensor Instances
Adafruit_TSL2561_Unified tsl = Adafruit_TSL2561_Unified(0x39, 12345);
Adafruit_BME280 bme;
const int moisturePin = A0;
const int trigPin = 8;
const int echoPin = 9;

// Initialize sensors
inline void initSensors() {
    // TSL2561 Initialization
    if (!tsl.begin()) {
        Serial.println("No TSL2561 sensor found. Check wiring!");
        while (1);
    }
    // Adjust TSL2561 settings to prevent overflow
    tsl.enableAutoRange(true);
    tsl.setGain(TSL2561_GAIN_1X);  // Lower gain
    tsl.setIntegrationTime(TSL2561_INTEGRATIONTIME_13MS); // Short integration time

    // BME280 Initialization with address detection
    if (!bme.begin(0x76) && !bme.begin(0x77)) {
        Serial.println("Could not find a valid BME280 sensor, check wiring!");
        while (1);
    }

    // Ultrasonic Sensor Pins
    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
}

// TSL2561 Reading Function
inline float readLux() {
    sensors_event_t event;
    tsl.getEvent(&event);
    if (event.light > 0 && event.light < 65535) {
        return event.light;
    } else {
        Serial.println("TSL2561 overflow! Adjust gain or integration time.");
        return -1;
    }
}

// BME280 Reading Functions
inline float readTemperature() {
    float temp = bme.readTemperature();
    if (temp > -40 && temp < 85) {
        return temp;
    } else {
        Serial.println("Invalid BME280 temperature reading!");
        return -1;
    }
}

inline float readHumidity() {
    float hum = bme.readHumidity();
    if (hum >= 0 && hum <= 100) {
        return hum;
    } else {
        Serial.println("Invalid BME280 humidity reading!");
        return -1;
    }
}

inline float readPressure() {
    float pres = bme.readPressure() / 100.0F; // Convert Pa to hPa
    if (pres > 300 && pres < 1100) {
        return pres;
    } else {
        Serial.println("Invalid BME280 pressure reading!");
        return -1;
    }
}

// Soil Moisture Reading Function
inline int readSoilMoisture() {
    int moisture = analogRead(moisturePin);
    if (moisture >= 0 && moisture <= 1023) {
        return moisture;
    } else {
        Serial.println("Invalid soil moisture reading!");
        return -1;
    }
}

// Ultrasonic Sensor Reading Function
inline float readDistance() {
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);
    float duration = pulseIn(echoPin, HIGH);
    float distance = (duration * 0.0343) / 2; // cm
    if (distance > 0 && distance < 400) {
        return distance;
    } else {
        Serial.println("Invalid ultrasonic distance reading!");
        return -1;
    }
}

#endif

// #ifndef SENSORS_H
// #define SENSORS_H

// #include <Wire.h>
// #include <Adafruit_Sensor.h>
// #include <Adafruit_TSL2561_U.h>
// #include <Adafruit_BME280.h>
// #include <ArduinoJson.h>

// // Sensor Instances
// Adafruit_TSL2561_Unified tsl = Adafruit_TSL2561_Unified(0x39, 12345);
// Adafruit_BME280 bme;
// const int moisturePin = A0;
// const int trigPin = 8;
// const int echoPin = 9;

// // Initialize sensors
// inline void initSensors() {
//     if (!tsl.begin()) {
//         Serial.println("No TSL2561 sensor found. Check wiring!");
//         while (1);
//     }
//     tsl.enableAutoRange(true);
//     tsl.setIntegrationTime(TSL2561_INTEGRATIONTIME_13MS);

//     if (!bme.begin(0x77)) {
//         Serial.println("Could not find a valid BME280 sensor, check wiring!");
//         while (1);
//     }

//     pinMode(trigPin, OUTPUT);
//     pinMode(echoPin, INPUT);
// }

// #endif