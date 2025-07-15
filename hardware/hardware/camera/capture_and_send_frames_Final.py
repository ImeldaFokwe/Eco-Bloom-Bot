import os
import cv2
import requests
import time

# --- Configuration ---
SERVER_URL = "http://192.168.2.151:5002/camera/upload"
AUTH_URL = "http://192.168.2.151:5002/auth/login"  # Authentication endpoint
EMAIL = "test@ecobloom.com"  # Replace with valid credentials
PASSWORD = "123456"  # Replace with valid credentials

# Set camera type: "usb" for testing; "picam" for the Raspberry Pi Camera Module v2.1
CAMERA_TYPE = "usb"  # Change to "picam" when using the camera module

# Create a folder to store frames locally (optional)
save_path = "frames"
os.makedirs(save_path, exist_ok=True)

# --- Authentication ---
auth_token = None
def authenticate():
    global auth_token
    try:
        response = requests.post(AUTH_URL, json={"email": EMAIL, "password": PASSWORD})
        if response.status_code == 200:
            auth_token = response.json().get("token")
            print("Authentication successful! Token retrieved.")
        else:
            print(f"Authentication failed: {response.status_code}, {response.text}")
            auth_token = None
    except Exception as e:
        print(f"Error during authentication: {e}")
        auth_token = None

# Perform authentication before starting the camera
authenticate()

# --- Camera Initialization ---
if CAMERA_TYPE == "usb":
    # Using a USB webcam
    cap = cv2.VideoCapture(0)  # 0 selects the default webcam
    if not cap.isOpened():
        print("Error: Could not open the USB camera.")
        exit()
elif CAMERA_TYPE == "picam":
    # Using the Raspberry Pi Camera Module v2.1 with Picamera2
    try:
        from picamera2 import Picamera2
        picam2 = Picamera2()
        preview_config = picam2.create_preview_configuration()
        picam2.configure(preview_config)
        picam2.start()
    except Exception as e:
        print("Error initializing Picamera2:", e)
        exit()
else:
    print("Invalid CAMERA_TYPE specified. Use 'usb' or 'picam'.")
    exit()

# Helper function to capture a frame based on camera type
def get_frame():
    if CAMERA_TYPE == "usb":
        ret, frame = cap.read()
        if not ret:
            print("Failed to capture frame from USB camera.")
            return None
        return frame
    elif CAMERA_TYPE == "picam":
        try:
            # Capture frame from Pi Camera Module using Picamera2
            frame = picam2.capture_array()
            return frame
        except Exception as e:
            print("Error capturing frame from Pi Camera Module:", e)
            return None

frame_count = 0
print("Press 'q' to stop capturing frames (if image window is enabled).")

while True:
    frame = get_frame()
    if frame is None:
        print("No frame captured. Exiting...")
        break

    # Save frame locally (optional)
    filename = os.path.join(save_path, f"frame_{frame_count:04d}.jpg")
    cv2.imwrite(filename, frame)
    print(f"Saved: {filename}")

    # Encode frame as JPEG
    _, img_encoded = cv2.imencode('.jpg', frame)
    files = {'frame': ('frame.jpg', img_encoded.tobytes(), 'image/jpeg')}

    headers = {}
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"

    try:
        response = requests.post(SERVER_URL, files=files, headers=headers)
        if response.status_code == 200:
            print(f"Frame {frame_count} uploaded successfully.")
        elif response.status_code == 401:  # Unauthorized
            print("Token expired, re-authenticating...")
            authenticate()
        else:
            print(f"Failed to upload frame {frame_count}: {response.status_code}, {response.text}")
    except Exception as e:
        print(f"Error uploading frame {frame_count}: {e}")

    frame_count += 1

    # Comment out these lines to disable the image window display:
    # cv2.imshow("Camera Stream", frame)
    # if cv2.waitKey(1) & 0xFF == ord('q'):
    #     break

    # Optional: add a delay if needed
    # time.sleep(1)

# Cleanup
if CAMERA_TYPE == "usb":
    cap.release()
elif CAMERA_TYPE == "picam":
    picam2.stop()
cv2.destroyAllWindows()
print(f"Frames saved in: {save_path}")