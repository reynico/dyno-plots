#!/usr/bin/env python3
""" Quick example on how to convert a MWD dyno file to
a Pandas dataframe with just the required information """

import xml.etree.ElementTree as etree
import pandas as pd

rpm_samples = []
tq_samples = []
hp_samples = []

root = etree.parse('samples/mwd_sample.ad3').getroot()
for reg in root.iter('Ensayo'):
    root1 = etree.Element('root')
    root1 = reg
    for canal_virtual in root1.iter('CanalVirtual'):
        root2 = etree.Element('root')
        root2 = canal_virtual
        for nombre in root2.iter('Nombre'):
            root3 = etree.Element('root')
            root3 = nombre
            if root3.text and root3.text.lower() == "rpm motor":
                for muestras in root2.iter('Muestra'):
                    rpm_samples = muestras.text.split(", ")
            if root3.text == "Torque Corr":
                for muestras in root2.iter('Muestra'):
                    tq_samples = muestras.text.split(", ")
            if root3.text == "Potencia Corr":
                for muestras in root2.iter('Muestra'):
                    hp_samples = muestras.text.split(", ")


pd = pd.DataFrame(
    {'rpm': rpm_samples,
     'tq': tq_samples,
     'hp': hp_samples
     })

print(pd)
