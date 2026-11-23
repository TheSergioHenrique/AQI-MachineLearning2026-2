import argparse
import json
import os
import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, balanced_accuracy_score, f1_score
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, OneHotEncoder, RobustScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier

RANDOM_STATE = 42
TRAIN_END = '2018-12-31'
VAL_END = '2019-12-31'
MAX_FALTANTES = 0.50
FFILL_LIMITE = 3

ORDEM = ['Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe']
MAPA = {c: i for i, c in enumerate(ORDEM)}
POLUENTES = ['PM2.5', 'PM10', 'NO', 'NO2', 'NOx', 'NH3', 'CO', 'SO2', 'O3', 'Benzene', 'Toluene', 'Xylene']
POLUENTES_CHAVE = ['PM2.5', 'PM10', 'NO2', 'CO', 'SO2', 'O3']

MODELOS = {
    'Regressão Logística': LogisticRegression(max_iter=2000, class_weight='balanced', C=1.686248206155922),
    'Árvore de Decisão': DecisionTreeClassifier(class_weight='balanced', random_state=RANDOM_STATE,
                                                max_depth=30, min_samples_leaf=36, min_samples_split=14),
    'Random Forest': RandomForestClassifier(class_weight='balanced', n_jobs=-1, random_state=RANDOM_STATE,
                                            n_estimators=233, max_depth=21, min_samples_leaf=18,
                                            max_features=0.9765584195159227),
    'KNN': KNeighborsClassifier(n_neighbors=16, weights='distance', p=1),
    'SVM': SVC(class_weight='balanced', random_state=RANDOM_STATE, C=5.316725249428607,
               gamma=0.008309128416649362),
}
MODELO_FINAL = 'Random Forest'


CSV_PADRAO = Path(__file__).parent / 'dados' / 'city_day.csv'


def carregar(caminho):
    if caminho is None and CSV_PADRAO.exists():
        caminho = CSV_PADRAO
    if caminho is None:
        import kagglehub
        caminho = os.path.join(kagglehub.dataset_download('rohanrao/air-quality-data-in-india'), 'city_day.csv')
    df = pd.read_csv(caminho, parse_dates=['Date'])
    return df.sort_values(['City', 'Date']).drop_duplicates(['City', 'Date']).reset_index(drop=True)


def calendario_continuo(df):
    partes = []
    for cidade, g in df.groupby('City'):
        g = g.set_index('Date')
        g = g.reindex(pd.date_range(g.index.min(), g.index.max(), freq='D'))
        g['City'] = cidade
        partes.append(g.rename_axis('Date').reset_index())
    return pd.concat(partes, ignore_index=True)


def preparar(df):
    df = calendario_continuo(df)
    brutos = df[POLUENTES].where(df[POLUENTES] >= 0).add_prefix('raw_')
    df[POLUENTES] = df[POLUENTES].where(df[POLUENTES] >= 0)

    falt = df[POLUENTES].isna().mean()
    usadas = [p for p in POLUENTES if falt[p] <= MAX_FALTANTES]
    df[usadas] = df.groupby('City')[usadas].ffill(limit=FFILL_LIMITE)

    df['bucket_hoje'] = df['AQI_Bucket'].map(MAPA)
    df['alvo'] = df.groupby('City')['bucket_hoje'].shift(-1)

    for p in [c for c in POLUENTES_CHAVE if c in usadas]:
        g = df.groupby('City')[p]
        df[f'{p}_lag1'] = g.shift(1)
        df[f'{p}_lag2'] = g.shift(2)
        df[f'{p}_med3'] = g.transform(lambda s: s.rolling(3, min_periods=1).mean())
        df[f'{p}_med7'] = g.transform(lambda s: s.rolling(7, min_periods=1).mean())

    df['bucket_lag1'] = df.groupby('City')['bucket_hoje'].shift(1)
    df['mes_sin'] = np.sin(2 * np.pi * df['Date'].dt.month / 12)
    df['mes_cos'] = np.cos(2 * np.pi * df['Date'].dt.month / 12)

    derivadas = [c for c in df.columns if c.endswith(('_lag1', '_lag2', '_med3', '_med7')) and c != 'bucket_lag1']
    colunas = {
        'log': usadas + derivadas,
        'plain': ['bucket_hoje', 'bucket_lag1', 'mes_sin', 'mes_cos'],
        'cat': ['City'],
    }
    return pd.concat([df, brutos], axis=1), colunas, usadas


def neg_para_nan(X):
    X = np.asarray(X, dtype=float).copy()
    X[X < 0] = np.nan
    return X


def preprocessador(colunas):
    pipe_log = Pipeline([
        ('neg', FunctionTransformer(neg_para_nan)),
        ('log', FunctionTransformer(np.log1p)),
        ('imp', SimpleImputer(strategy='median')),
        ('esc', RobustScaler()),
    ])
    pipe_plain = Pipeline([('imp', SimpleImputer(strategy='median')), ('esc', RobustScaler())])
    return ColumnTransformer([
        ('log', pipe_log, colunas['log']),
        ('plain', pipe_plain, colunas['plain']),
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), colunas['cat']),
    ], sparse_threshold=0)


def avaliar(y_true, y_pred):
    y_true, y_pred = np.asarray(y_true), np.asarray(y_pred)
    return {
        'f1_macro': round(float(f1_score(y_true, y_pred, average='macro', zero_division=0)), 4),
        'acc': round(float(accuracy_score(y_true, y_pred)), 4),
        'bal_acc': round(float(balanced_accuracy_score(y_true, y_pred)), 4),
        'adj': round(float(np.mean(np.abs(y_true - y_pred) <= 1)), 4),
    }


def main():
    parser = argparse.ArgumentParser(description='Treina os modelos e gera os artefatos usados pela API.')
    parser.add_argument('--csv', help='caminho do city_day.csv (padrão: dados/city_day.csv ou download com kagglehub)')
    parser.add_argument('--saida', default=str(Path(__file__).parent / 'artefatos'))
    args = parser.parse_args()

    saida = Path(args.saida)
    saida.mkdir(parents=True, exist_ok=True)

    df, colunas, usadas = preparar(carregar(args.csv))
    features = colunas['log'] + colunas['plain'] + colunas['cat']

    dados = df.dropna(subset=['alvo', 'bucket_hoje'])
    m_tv = dados['Date'] <= VAL_END
    m_test = dados['Date'] > VAL_END
    X_tv, y_tv = dados.loc[m_tv, features], dados.loc[m_tv, 'alvo'].astype(int)
    X_test, y_test = dados.loc[m_test, features], dados.loc[m_test, 'alvo'].astype(int)
    print(f'Treino + validação: {len(X_tv)} | Teste: {len(X_test)}')

    resultados = [{'modelo': 'Persistência (amanhã = hoje)', **avaliar(y_test, X_test['bucket_hoje'].astype(int))}]
    final = None
    for nome, clf in MODELOS.items():
        t0 = time.time()
        pipe = Pipeline([('prep', preprocessador(colunas)), ('clf', clone(clf))]).fit(X_tv, y_tv)
        resultados.append({'modelo': nome, **avaliar(y_test, pipe.predict(X_test))})
        print(f'{nome}: F1 macro {resultados[-1]["f1_macro"]:.3f} ({time.time() - t0:.0f}s)')
        if nome == MODELO_FINAL:
            final = pipe

    for r in resultados:
        r['escolhido'] = r['modelo'] == MODELO_FINAL

    joblib.dump(final, saida / 'modelo.joblib')

    validos = df['bucket_hoje'].notna()
    probs = np.full((len(df), len(ORDEM)), np.nan)
    classes = final.named_steps['clf'].classes_.astype(int)
    probs[np.ix_(validos.to_numpy(), classes)] = final.predict_proba(df.loc[validos, features])

    tabela = pd.DataFrame({
        'cidade': df['City'],
        'data': df['Date'].dt.strftime('%Y-%m-%d'),
        'aqi': df['AQI'],
        'categoria': df['bucket_hoje'],
        'categoria_prevista': np.where(validos, np.nanargmax(np.nan_to_num(probs, nan=-1), axis=1), np.nan),
        'categoria_real': df['alvo'],
        'conjunto': np.select([df['Date'] <= TRAIN_END, df['Date'] <= VAL_END], ['treino', 'validação'], 'teste'),
    })
    for i in range(len(ORDEM)):
        tabela[f'prob_{i}'] = probs[:, i].round(4)
    for p in POLUENTES:
        if p in usadas:
            tabela[p] = df[f'raw_{p}']
    tabela.to_csv(saida / 'previsoes.csv', index=False)

    meta = {
        'modelo_final': MODELO_FINAL,
        'periodo': {'inicio': tabela['data'].min(), 'fim': tabela['data'].max()},
        'divisao': {'treino_ate': TRAIN_END, 'validacao_ate': VAL_END},
        'poluentes': usadas,
        'resultados_teste': resultados,
    }
    (saida / 'metricas.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2))
    print(f'Artefatos salvos em {saida}')


if __name__ == '__main__':
    main()
