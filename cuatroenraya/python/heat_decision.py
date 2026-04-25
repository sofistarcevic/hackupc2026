from enum import Enum


class DiffuserState(Enum):
    OFF = "off"
    LOW = "low"
    HIGH = "high"


def evaluate_heat_conditions(temperature: float, humidity: float):
    """
    Returns:
        diffuser_state -> off / low / high
        heatwave_alert -> True / False
    """

    # ---------------------------
    # 1. Detect heatwave
    # ---------------------------
    heatwave_alert = False

    if temperature >= 35:
        heatwave_alert = True

    elif temperature >= 32 and humidity >= 70:
        heatwave_alert = True


    # ---------------------------
    # 2. Decide diffuser intensity
    # ---------------------------

    # no cooling needed
    if temperature < 30:
        diffuser_state = DiffuserState.OFF.value

    # humidity too high → mist becomes less effective
    elif humidity > 85:
        diffuser_state = DiffuserState.OFF.value

    # extreme heat + good evaporation conditions
    elif temperature >= 35 and humidity <= 70:
        diffuser_state = DiffuserState.HIGH.value

    # high temperature but humidity moderately high
    elif temperature >= 32:
        diffuser_state = DiffuserState.LOW.value

    # warm but not dangerous
    elif temperature >= 30:
        diffuser_state = DiffuserState.LOW.value

    else:
        diffuser_state = DiffuserState.OFF.value

    return diffuser_state, heatwave_alert