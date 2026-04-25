import cv2
import os

carpeta = "dataset_fotos"
os.makedirs(carpeta, exist_ok=True)

# Webcam externa
cam = cv2.VideoCapture(1, cv2.CAP_DSHOW)

if not cam.isOpened():
    print("No s'ha pogut obrir la webcam")
    exit()

contador = 0

while True:
    ret, frame = cam.read()

    if not ret:
        print("No es pot llegir frame de la webcam")
        break

    cv2.imshow("Webcam BRIO - S guardar / ESC sortir", frame)

    tecla = cv2.waitKey(1) & 0xFF

    if tecla == ord("s"):
        nom = os.path.join(carpeta, f"foto_{contador:04d}.jpg")
        cv2.imwrite(nom, frame)
        print(f"Foto guardada: {nom}")
        contador += 1

    elif tecla == 27:
        break

cam.release()
cv2.destroyAllWindows()