#ifndef CONFIG_H
#define CONFIG_H

// Server IP and Port
const char* SERVER_IP = "192.168.43.76";                 // Server IP address
const int SERVER_PORT = 5002;               // Server port

// Hotspot credentials (Fallback for Demo)
#define WIFI_SSID "Phone"
#define WIFI_PASSWORD "hotspot-password"

#define USER_EMAIL "test@ecobloom.com"
#define USER_PASSWORD "123456"

// Window: ipconfig | grep "inet "
// Mac: ifconfig | grep "inet "
// Linux: ip a

#endif
