import cv2
from edge_impulse_linux.image import ImageImpulseRunner

MODEL_PATH = "/home/arduino/.arduino-bricks/ei-models/person_model.eim"

runner = None


def initialize_model():
    global runner

    if runner is None:
        runner = ImageImpulseRunner(MODEL_PATH)
        model_info = runner.init()
        print("Model initialized")
        print(model_info)


def detect_person(frame):
    global runner

    if runner is None:
        initialize_model()

    features, cropped = runner.get_features_from_image(frame)

    result = runner.classify(features)

    bounding_boxes = result["result"]["bounding_boxes"]

    for box in bounding_boxes:
        if box["label"] == "person":
            return True

    return False