# Frontend da Previsão da Qualidade do Ar (Grupo 7)

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

O backend está em `../backend` (veja o README de lá). Com ele rodando em `http://localhost:8000`, basta abrir as páginas.

Em `js/config.js`:

```js
var CONFIG = {
  API_BASE_URL: 'http://localhost:8000/api',
  USE_MOCK: false
};
```

Com `USE_MOCK: true` o site usa dados simulados, sem precisar do backend.

## Rotas da API

Todas as respostas são JSON. Datas em `AAAA-MM-DD`. Categorias são números de 0 a 5:
0 = Bom, 1 = Satisfatório, 2 = Moderado, 3 = Ruim, 4 = Muito Ruim, 5 = Severo. Valores ausentes vêm como `null`.

### `GET /api/cidades`
```json
[{ "nome": "Delhi" }, { "nome": "Mumbai" }]
```

### `GET /api/periodo`
```json
{ "inicio": "2015-01-01", "fim": "2020-07-01" }
```

### `GET /api/previsao?cidade=Delhi&data=2020-06-30`
`data` é o dia de referência; a previsão é para o dia seguinte.
```json
{
  "cidade": "Delhi",
  "data_base": "2020-06-30",
  "data_prevista": "2020-07-01",
  "aqi_atual": 114.0,
  "categoria_atual": 2,
  "categoria_prevista": 2,
  "probabilidades": [0.019, 0.4138, 0.5021, 0.0616, 0.0033, 0.0003],
  "categoria_real": 2,
  "conjunto": "teste",
  "modelo": "Random Forest",
  "f1_modelo": 0.7249,
  "poluentes": { "PM2.5": 39.8, "PM10": 91.98, "NO": 5.99, "NO2": 17.96, "NOx": 15.44,
                 "NH3": 28.48, "CO": 0.84, "SO2": 10.51, "O3": 37.29, "Benzene": 1.57, "Toluene": 16.37 }
}
```
- `categoria_real`: categoria observada no dia seguinte (`null` se não houver).
- `conjunto`: `treino`, `validação` ou `teste`, conforme a data.
- Sem categoria do AQI no dia de referência, `categoria_prevista` e `probabilidades` vêm `null`.

### `GET /api/historico?cidade=Delhi&data=2020-06-30&dias=30`
```json
[{ "data": "2020-06-29", "aqi": 233.0, "categoria": 3 }, { "data": "2020-06-30", "aqi": 114.0, "categoria": 2 }]
```

### `GET /api/mapa?data=2020-06-30`
```json
[{ "cidade": "Delhi", "aqi_atual": 114.0, "categoria_atual": 2, "categoria_prevista": 2 }]
```

### `GET /api/modelos`
```json
{
  "divisao": { "treino_ate": "2018-12-31", "validacao_ate": "2019-12-31" },
  "resultados": [
    { "modelo": "Persistência (amanhã = hoje)", "f1_macro": 0.6964, "acc": 0.7739, "bal_acc": 0.6989, "adj": 0.9938, "escolhido": false },
    { "modelo": "Random Forest", "f1_macro": 0.7249, "acc": 0.7527, "bal_acc": 0.7825, "adj": 0.9958, "escolhido": true }
  ]
}
```
