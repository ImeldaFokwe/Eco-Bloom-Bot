#ifndef WIFI_UTILS_H
#define WIFI_UTILS_H

#include <WiFi.h>
#include <ArduinoJson.h>
#include "config.h"

extern String authToken;
extern bool isAuthenticated;

// Connect to Wi-Fi
inline void connectToWiFi() {
    Serial.println("Starting Wi-Fi connection...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) { // Retry for up to 20 seconds
        delay(1000);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWi-Fi connected!");
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\nFailed to connect to Wi-Fi. Check your SSID and password.");
    }
}


// Authenticate and retrieve token
inline bool authenticate() {
  WiFiClient authClient;

  if (!authClient.connect(SERVER_IP, SERVER_PORT)) {
    Serial.println("Failed to connect for authentication.");
    return false;
  }

  authClient.println("POST /auth/login HTTP/1.1");
  authClient.println("Host: " + String(SERVER_IP));
  authClient.println("Content-Type: application/json");
  authClient.println("Connection: close");

  StaticJsonDocument<200> doc;
  doc["email"] = USER_EMAIL;
  doc["password"] = USER_PASSWORD;

  String requestBody;
  serializeJson(doc, requestBody);
  authClient.println("Content-Length: " + String(requestBody.length()));
  authClient.println();
  authClient.print(requestBody);

  unsigned long timeout = millis();
  while (authClient.available() == 0) {
    if (millis() - timeout > 5000) {
      Serial.println("Timeout waiting for auth response");
      authClient.stop();
      return false;
    }
  }

  // Skip headers
  while (authClient.available()) {
    String line = authClient.readStringUntil('\n');
    if (line == "\r") break;
  }

  String response = authClient.readString();
  Serial.println("Server Response:");
  Serial.println(response);

  StaticJsonDocument<512> responseDoc;
  DeserializationError error = deserializeJson(responseDoc, response);
  if (error) {
    Serial.println("Failed to parse auth response");
    return false;
  }

  authToken = responseDoc["token"].as<String>();
  isAuthenticated = true;
  Serial.println("Authentication successful! Token retrieved.");
  return true;
}


// Add auth header
inline void addAuthHeader(WiFiClient& client) {
    if (authToken != "") {
        client.println("Authorization: Bearer " + authToken);
    }
}

#endif
