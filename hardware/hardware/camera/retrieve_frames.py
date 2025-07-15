import cv2
import numpy as np
import mysql.connector

# Database settings - Change this based on your setup
DB_CONFIG = {
    "host": "db-ebb.cb2gwesik3ly.us-east-2.rds.amazonaws.com",  # IP of your RPI running the database
    "user": "admin",  # Change to your database username
    "password": "Capstone&bd2025",  # Change to your database password
    "database": "db_ebb"  # Change to your actual database name
}

# Connect to the database
try:
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    print("Connected to database successfully.")
except mysql.connector.Error as err:
    print(f"Error connecting to database: {err}")
    exit()

# Query to retrieve stored frames (assumes column 'frame_data' holds LONGBLOB images)
query = "SELECT frame_data FROM camera_frames ORDER BY id ASC"
cursor.execute(query)

# Fetch and display each frame
frames = cursor.fetchall()
for i, (frame_data,) in enumerate(frames):
    np_array = np.frombuffer(frame_data, dtype=np.uint8)
    image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    if image is None:
        print(f"Error decoding frame {i}")
        continue

    cv2.imshow(f"Frame {i}", image)

    if cv2.waitKey(1000) & 0xFF == ord('q'):  # Press 'q' to quit
        break

# Cleanup
cv2.destroyAllWindows()
cursor.close()
conn.close()
print("Finished displaying frames.")
