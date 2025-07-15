#ifndef ACTUATORS_H
#define ACTUATORS_H

// Define relay pins for actuators
const int fanRelayPin = 10;
const int lightRelayPin = 11;
const int pumpRelayPin = 12;

const int lightPwmPin = 5;  // PWM pin for IRLB8721 (D5)

// Control modes
enum ControlMode { AUTO,
                   MANUAL };

// Control mode for each actuator
ControlMode fanMode = MANUAL;
ControlMode lightMode = MANUAL;
ControlMode pumpMode = MANUAL;

// Initialize the actuators
inline void initActuators() {
  pinMode(fanRelayPin, OUTPUT);
  pinMode(lightRelayPin, OUTPUT);
  pinMode(pumpRelayPin, OUTPUT);

  pinMode(lightPwmPin, OUTPUT);
  analogWrite(lightPwmPin, 0);  // default to 0 brightness

  // Set relays to HIGH initially (off for low-level trigger relays)
  digitalWrite(fanRelayPin, HIGH);
  digitalWrite(lightRelayPin, HIGH);
  digitalWrite(pumpRelayPin, HIGH);
}

// Function to manually control actuators
inline void manualFanControl(bool turnOn) {
  digitalWrite(fanRelayPin, turnOn ? LOW : HIGH);
}

inline void manualLightControl(bool turnOn) {
  digitalWrite(lightRelayPin, turnOn ? LOW : HIGH);
}

inline void manualPumpControl(bool turnOn) {
  digitalWrite(pumpRelayPin, turnOn ? LOW : HIGH);
}

// Function to update actuators
inline void updateActuator(const char* name, const char* mode, const char* status, int intensity = 0) {
  if (strcmp(name, "fan") == 0) {
    fanMode = (strcmp(mode, "manual") == 0) ? MANUAL : AUTO;
    if (fanMode == MANUAL) {
      manualFanControl(strcmp(status, "on") == 0);
    }
  } else if (strcmp(name, "light") == 0) {
    lightMode = (strcmp(mode, "manual") == 0) ? MANUAL : AUTO;

    if (lightMode == MANUAL) {
      // If using relay + PWM: always enable relay when light is on
      if (strcmp(status, "on") == 0) {
        digitalWrite(lightRelayPin, LOW);  // turn relay ON
        intensity = constrain(intensity, 0, 100);
        int pwmValue = map(intensity, 0, 100, 0, 255);
        analogWrite(lightPwmPin, pwmValue);  // set brightness
      } else {
        digitalWrite(lightRelayPin, HIGH);  // turn relay OFF
        analogWrite(lightPwmPin, 0);        // safety
      }
    }
  } else if (strcmp(name, "pump") == 0) {
    pumpMode = (strcmp(mode, "manual") == 0) ? MANUAL : AUTO;
    if (pumpMode == MANUAL) {
      manualPumpControl(strcmp(status, "on") == 0);
    }
  }
}

#endif
