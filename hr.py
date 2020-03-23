#!/usr/bin/env python3
""" Quick example on how to convert a Horacio Resio dyno file to
a Pandas dataframe with just the required information """

import pandas as pd
hr = pd.read_csv(r'samples/horacio_resio_sample.ine', encoding="ISO-8859-1",
                 skiprows=range(0, 24), delim_whitespace=True)  # Remove header
hr.drop(hr.index[0], inplace=True)  # Remove "Kgm Cv" line
hr.rename(columns={'RPM_VEH': 'rpm', 'POT_RUEDA': 'hp'}, inplace=True)  # Normalize column data
hr['tq'] = hr['hp'] * 716 / hr['rpm']  # Convert wheel torque to crank torque. This is an "estimation" handled by a constant
hr.drop(['TIEMPO', 'RPM_ROD', 'TORQUE', 'POT_PER', 'POT_CIGUE', 'SENSOR', 'AUX1', 'SENSOR.1', 'AUX2',
         'SENSOR.2', 'AUX3', 'SENSOR.3', 'AUX4', 'SENSOR.4', 'AUX5'], axis=1, inplace=True)  # Remove unused columns

hr = hr.iloc[::-1]  # Invert dataframe

print(hr)
