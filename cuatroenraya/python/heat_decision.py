# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.

# Copyright (c) 2026 CuatroEnRaya Team

from enum import Enum

class DiffuserState(Enum):
    OFF = 0
    LOW = 1
    HIGH = 2

def evaluate_heat_conditions(temperature: float, humidity: float):
    #detect heatwave:
    heatwave_alert = False

    if temperature >= 35:
        heatwave_alert = True
    elif temperature >= 32 and humidity >= 70:
        heatwave_alert = True

    #diffuser intensity:
    if temperature < 30:    #no cooling needed
        diffuser_state = DiffuserState.OFF.value

    #humidity too high → mist becomes less effective
    elif humidity > 85:
        diffuser_state = DiffuserState.OFF.value

    #extreme heat and good evaporation conditions
    elif temperature >= 35 and humidity <= 70:
        diffuser_state = DiffuserState.HIGH.value

    #high temperature but humidity moderately high
    #elif temperature >= 32:
        #diffuser_state = DiffuserState.LOW.value

    #warm but not dangerous
    elif temperature >= 30:
        diffuser_state = DiffuserState.LOW.value

    else:
        diffuser_state = DiffuserState.OFF.value

    return diffuser_state, heatwave_alert
