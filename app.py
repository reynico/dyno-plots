#!/usr/bin/env python3

import base64
import io
import plotly.graph_objs as go
import cufflinks as cf
import xml.etree.ElementTree as etree
import dash
from dash.dependencies import Input, Output, State
import dash_core_components as dcc
import dash_html_components as html
import dash_table
import pandas as pd

external_stylesheets = ['https://codepen.io/chriddyp/pen/bWLwgP.css']
app = dash.Dash(__name__, external_stylesheets=external_stylesheets)
server = app.server
app.config['suppress_callback_exceptions'] = True


colors = {
    "graphBackground": "#F5F5F5",
    "background": "#ffffff",
    "text": "#000000"
}

config = {
    'toImageButtonOptions':
    {
        'width': 1000,
        'height': 600,
        'format': 'png',
        'filename': 'dyno'
    }
}

app.layout = html.Div([
    dcc.Upload(
        id='upload-data',
        children=html.Div([
            'Drag and Drop or ',
            html.A('Select Files')
        ]),
        style={
            'width': '100%',
            'height': '60px',
            'lineHeight': '60px',
            'borderWidth': '1px',
            'borderStyle': 'dashed',
            'borderRadius': '5px',
            'textAlign': 'center',
            'margin': '10px'
        },
        # Allow multiple files to be uploaded
        multiple=True
    ),
    dcc.Graph(id='Mygraph', config=config),
    html.Div(id='output-data-upload')
])


def parse_horacio_resio(hr):
    """ Horacio Resio dyno software uses a kind-of CSV
        format (not pure CSV 'tho), so we need to make
        some transformations over the file header to get
        something parsable """
    hr.drop(hr.index[0], inplace=True)  # Remove "Kgm Cv" line
    hr.rename(columns={'RPM_VEH': 'rpm', 'POT_RUEDA': 'hp'},
              inplace=True)  # Normalize column data
    # Convert wheel torque to crank torque. This is an "estimation" handled by a constant
    hr['tq'] = hr['hp'] * 716 / hr['rpm']
    hr.drop(['TIEMPO', 'RPM_ROD', 'TORQUE', 'POT_PER', 'POT_CIGUE', 'SENSOR', 'AUX1', 'SENSOR.1', 'AUX2',
             'SENSOR.2', 'AUX3', 'SENSOR.3', 'AUX4', 'SENSOR.4', 'AUX5'], axis=1, inplace=True)  # Remove unused columns

    hr = hr.iloc[::-1]  # Invert dataframe
    return hr


def parse_mwd(root):
    """ MWD uses a XML format file to store the data,
        although it is a good format, the way the devs
        at MWD handled this is quite tricky """
    rpm_samples = []
    tq_samples = []
    hp_samples = []
    for reg in root.iter('Ensayo'):  # Party starts here
        root1 = etree.Element('root')
        root1 = reg
        for canal_virtual in root1.iter('CanalVirtual'):
            root2 = etree.Element('root')
            root2 = canal_virtual
            # Pick just the required columns
            for nombre in root2.iter('Nombre'):
                root3 = etree.Element('root')
                root3 = nombre
                if root3.text == "RPM Motor":
                    for muestras in root2.iter('Muestra'):
                        rpm_samples = muestras.text.split(", ")
                if root3.text == "Torque Corr":
                    for muestras in root2.iter('Muestra'):
                        tq_samples = muestras.text.split(", ")
                if root3.text == "Potencia Corr":
                    for muestras in root2.iter('Muestra'):
                        hp_samples = muestras.text.split(", ")
    mwd = pd.DataFrame(  # Build a dataframe with the sanitized output
        {'rpm': rpm_samples,
         'tq': tq_samples,
         'hp': hp_samples
         })
    return mwd


def build_table(contents, filename):
    """ This is the table displayed at bottom. It's 
        useful to debug as well as check some values """
    df = parse_data(contents, filename)
    return html.Div([
        html.H5(filename),
        dash_table.DataTable(
            data=df.to_dict('records'),
            columns=[{'name': i, 'id': i} for i in df.columns]
        )
    ])


def parse_data(contents, filename):
    """ This is the way I handle the different file formats,
        as everyone have its complications and settings """
    content_type, content_string = contents.split(',')
    decoded = base64.b64decode(content_string)
    try:
        if 'csv' in filename:
            # Generic format with rpm, hp, tq header
            df = pd.read_csv(
                io.StringIO(decoded.decode('utf-8')))
        elif 'ine' in filename:
            # Horacio Resio
            df = parse_horacio_resio(pd.read_csv(
                io.StringIO(decoded.decode('iso-8859-1')), skiprows=range(0, 24), delim_whitespace=True))
        elif 'ad3' in filename:
            # MWD
            df = parse_mwd(etree.parse(io.StringIO(
                decoded.decode('iso-8859-1'))).getroot())
    except Exception as e:
        print(e)
        return html.Div([
            'There was an error processing this file.'
        ])

    return df


@app.callback(Output('Mygraph', 'figure'),
              [
    Input('upload-data', 'contents'),
    Input('upload-data', 'filename')
])
def update_graph(contents, filename):
    """ The graph handles opne or more dyno plots at the same time.
        To help identify which plot belongs to each file, I
        append the filename (without extension) to the legend """
    fig = {
        'layout': go.Layout(
            plot_bgcolor=colors["graphBackground"],
            paper_bgcolor=colors["graphBackground"])
    }
    if contents:
        dfx1 = pd.DataFrame()
        for content, filen in zip(contents, filename):
            dfx = parse_data(content, filen)
            dfx.columns = dfx.columns.str.replace(
                'hp', 'whp %s' % filen.rsplit('.', 1)[0])
            dfx.columns = dfx.columns.str.replace(
                'tq', 'tq %s' % filen.rsplit('.', 1)[0])
            dfx1 = pd.concat([dfx, dfx1])
        dfx1 = dfx1.set_index(['rpm'])  # This is our X index
        fig['data'] = dfx1.iplot(asFigure=True, kind='line',
                                 mode='lines+markers', size=1).data

    return fig


@app.callback(Output('output-data-upload', 'children'),
              [Input('upload-data', 'contents')],
              [State('upload-data', 'filename')])
def update_output(list_of_contents, list_of_names):
    if list_of_contents is not None:
        children = [
            build_table(c, n) for c, n in
            zip(list_of_contents, list_of_names)]
        return children


if __name__ == '__main__':
    app.run_server(port=5001, debug=True)
