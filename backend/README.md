# Backend da Previsão da Qualidade do Ar (Grupo 7)

Prevê a **categoria do AQI do dia seguinte** (Bom, Satisfatório, Moderado, Ruim, Muito Ruim, Severo) para as 26 cidades do dataset `city_day`.

| Arquivo | Conteúdo |
|---|---|
| `AQI_city_day_pipeline_dia_seguinte.ipynb` | Notebook original (análise, comparação de modelos e ajuste por algoritmo genético) |
| `dados/city_day.csv` | Dataset usado no treino (Kaggle: rohanrao/air-quality-data-in-india) |
| `treinar.py` | Reproduz o pipeline do notebook, treina os modelos e gera os artefatos |
| `app.py` | API (FastAPI) consumida pelo frontend |

## Como rodar

```bash
cd backend
python -m pip install -r requirements.txt

python treinar.py
python -m uvicorn app:app --port 8000
```

O `treinar.py` usa o dataset em `dados/city_day.csv` (dá para trocar com `--csv`). Se o arquivo não existir, ele baixa com `kagglehub`. O treino leva menos de 1 minuto e grava em `artefatos/`:

- `modelo.joblib`: pipeline final (pré-processamento + Random Forest)
- `previsoes.csv`: previsão e probabilidades para cada cidade e dia
- `metricas.json`: resultados de todos os modelos no período de teste

## Relação com o notebook

O `treinar.py` **reproduz o notebook** `AQI_city_day_pipeline_dia_seguinte.ipynb`. A lógica de cada etapa foi copiada dele, e o notebook continua sendo a referência da análise.

- Mesmo pré-processamento, features e divisão temporal (treino até 2018, validação 2019, teste 2020).
- Os hiperparâmetros são os melhores encontrados pelo algoritmo genético no notebook e estão fixos no início do `treinar.py`; o script não roda o AG de novo (no Colab ele levou cerca de 1 hora).
- O modelo final é o **Random Forest**, o melhor na validação. Ele é treinado em treino + validação e avaliado uma única vez no teste.
- O resultado fica muito próximo do Colab: F1 macro de 0,725 no teste aqui, contra 0,737 lá (a diferença provavelmente vem da versão do scikit-learn). A persistência dá exatamente o mesmo valor nos dois.

**Se o notebook mudar** (novas variáveis, outros modelos, nova rodada do AG), as mesmas mudanças precisam ser feitas no `treinar.py`, e o treino deve ser rodado de novo.

## Rotas

Documentadas em `../frontend/README.md`. Com o servidor rodando, a documentação interativa fica em http://localhost:8000/docs.
