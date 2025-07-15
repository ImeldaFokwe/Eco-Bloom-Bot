import os
import cv2
import time
import requests
from picamera2 import Picamera2

SERVER_URL = "http://172.20.10.2:5002/camera/upload"  # Your server's IP

# Create a folder to store frames locally (optional)
save_path = "frames"
os.makedirs(save_path, exist_ok=True)

# Initialize camera
picam2 = Picamera2()
preview_config = picam2.create_preview_configuration()
picam2.configure(preview_config)
picam2.start()

frame_count = 0
print("Press 'q' to stop capturing frames.")

while True:
    # Capture frame
    frame = picam2.capture_array()

    # Save frame locally (optional)
    filename = os.path.join(save_path, f"frame_{frame_count:04d}.jpg")
    cv2.imwrite(filename, frame)
    print(f"Saved: {filename}")

    # Encode frame as JPEG
    _, img_encoded = cv2.imencode('.jpg', frame)
    files = {'frame': ('frame.jpg', img_encoded.tobytes(), 'image/jpeg')}  # Changed "file" to "frame"

    try:
        response = requests.post(SERVER_URL, files=files)
        if response.status_code == 200:
            print(f"Frame {frame_count} uploaded successfully.")
        elif response.status_code == 500:
            print("Cannot connect to server.")  # Fixed typo
        else:
            print(f"Failed to upload frame {frame_count}: {response.status_code}, {response.text}")
    except Exception as e:
        print(f"Error uploading frame {frame_count}: {e}")

    frame_count += 1

    # Show live stream
    cv2.imshow("Camera Stream", frame)

    # Wait for 'q' to quit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Cleanup
cv2.destroyAllWindows()
picam2.stop()
print(f"Frames saved in: {save_path}")