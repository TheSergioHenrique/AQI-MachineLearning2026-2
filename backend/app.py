import json
import math
from datetime import date, timedelta
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

ARTEFATOS = Path(__file__).parent / 'artefatos'

if not (ARTEFATOS / 'previsoes.csv').exists():
    raise SystemExit('Artefatos não encontrados. Rode antes: python treinar.py --csv caminho/city_day.csv')

META = json.loads((ARTEFATOS / 'metricas.json').read_text())
TABELA = pd.read_csv(ARTEFATOS / 'previsoes.csv').set_index(['cidade', 'data']).sort_index()
CIDADES = sorted(TABELA.index.get_level_values('cidade').unique())
F1_FINAL = next(r['f1_macro'] for r in META['resultados_teste'] if r['escolhido'])

app = FastAPI(title='API de Previsão da Qualidade do Ar')
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['GET'], allow_headers=['*'])


def limpo(v):
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    return v


def inteiro(v):
    v = limpo(v)
    return None if v is None else int(v)


def linha(cidade, data):
    try:
        return TABELA.loc[(cidade, data)]
    except KeyError:
        return None


def valida_cidade(cidade):
    if cidade not in CIDADES:
        raise HTTPException(404, f'Cidade desconhecida: {cidade}')


def dia_seguinte(data):
    return (date.fromisoformat(data) + timedelta(days=1)).isoformat()


@app.get('/api/cidades')
def cidades():
    return [{'nome': c} for c in CIDADES]


@app.get('/api/periodo')
def periodo():
    return META['periodo']


@app.get('/api/previsao')
def previsao(cidade: str, data: date):
    valida_cidade(cidade)
    data = data.isoformat()
    r = linha(cidade, data)
    if r is None:
        raise HTTPException(404, f'Sem registro de {cidade} em {data}')

    prevista = inteiro(r['categoria_prevista'])
    return {
        'cidade': cidade,
        'data_base': data,
        'data_prevista': dia_seguinte(data),
        'aqi_atual': limpo(r['aqi']),
        'categoria_atual': inteiro(r['categoria']),
        'categoria_prevista': prevista,
        'probabilidades': None if prevista is None else [float(r[f'prob_{i}']) for i in range(6)],
        'categoria_real': inteiro(r['categoria_real']),
        'conjunto': r['conjunto'],
        'modelo': META['modelo_final'],
        'f1_modelo': F1_FINAL,
        'poluentes': {p: limpo(r[p]) for p in META['poluentes']},
    }


@app.get('/api/historico')
def historico(cidade: str, data: date, dias: int = Query(30, ge=1, le=365)):
    valida_cidade(cidade)
    inicio = (data - timedelta(days=dias - 1)).isoformat()
    trecho = TABELA.loc[cidade].loc[inicio:data.isoformat()]
    return [
        {'data': d, 'aqi': limpo(r['aqi']), 'categoria': inteiro(r['categoria'])}
        for d, r in trecho.iterrows()
    ]


@app.get('/api/mapa')
def mapa(data: date):
    data = data.isoformat()
    saida = []
    for c in CIDADES:
        r = linha(c, data)
        saida.append({
            'cidade': c,
            'aqi_atual': None if r is None else limpo(r['aqi']),
            'categoria_atual': None if r is None else inteiro(r['categoria']),
            'categoria_prevista': None if r is None else inteiro(r['categoria_prevista']),
        })
    return saida


@app.get('/api/modelos')
def modelos():
    return {
        'divisao': META['divisao'],
        'resultados': META['resultados_teste'],
    }
