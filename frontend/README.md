# Frontend — Previsão da Qualidade do Ar (Grupo 7)

Site estático para o projeto de ML.

## Como rodar

```bash
cd frontend
python3 -m http.server 5500
```

## Páginas

`index.html`  Previsão: AQI de hoje × AQI previsto para amanhã, histórico (gráfico + tabela) e poluentes |
`mapa.html`   Mapa da Índia com o AQI de todas as cidades + ranking |
`sobre.html`  Metodologia, desempenho dos modelos e escala do AQI |

## Ligando no backend

Em `js/config.js`:

```js
var CONFIG = {
  API_BASE_URL: 'http://localhost:8000/api',
  USE_MOCK: false
};
```

Com `USE_MOCK: true` o site usa dados simulados (baseados nas medianas de AQI de cada cidade no `city_day.csv`).

O backend precisa liberar CORS para a origem do frontend (ex.: `http://localhost:5500`).

## Contrato da API esperado

Todas as respostas são JSON. Datas em `AAAA-MM-DD`.

### `GET /api/cidades`
```json
[{ "nome": "Delhi" }, { "nome": "Mumbai" }]
```

### `GET /api/previsao?cidade=Delhi&data=2020-06-30`
`data` é o dia de referência (dados conhecidos); a previsão é para o dia seguinte.
```json
{
  "cidade": "Delhi",
  "data_base": "2020-06-30",
  "data_prevista": "2020-07-01",
  "aqi_atual": 112,
  "aqi_previsto": 118,
  "modelo": "Árvore de Regressão",
  "mae_modelo": 28.4,
  "poluentes": { "PM2.5": 45.2, "PM10": 98.1, "NO": 10.3, "NO2": 25.0, "NOx": 30.1,
                 "NH3": 20.5, "CO": 0.9, "SO2": 12.0, "O3": 33.4, "Benzene": 1.2, "Toluene": 4.5 }
}
```
`mae_modelo` é opcional. Poluentes ausentes podem vir como `null`.

### `GET /api/historico?cidade=Delhi&data=2020-06-30&dias=30`
Os `dias` registros terminando em `data`, em ordem cronológica.
```json
[{ "data": "2020-06-01", "aqi": 140 }, { "data": "2020-06-02", "aqi": 131 }]
```

### `GET /api/mapa?data=2020-06-30`
Resumo de todas as cidades na data (usado no mapa). As coordenadas ficam no frontend (`js/api.js`).
```json
[{ "cidade": "Delhi", "aqi_atual": 203, "aqi_previsto": 182 }]
```

### `GET /api/modelos`
```json
[
  { "modelo": "Baseline (AQI amanhã = hoje)", "mae": 34.1, "rmse": 58.7 },
  { "modelo": "Árvore de Regressão", "mae": 28.4, "rmse": 49.6 }
]
```
