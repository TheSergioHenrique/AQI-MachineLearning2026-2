# Previsão da Qualidade do Ar 🌫️

Este é o projeto do **Grupo 7** (Sergio Henrique, Maria Luisa, Arthur Pontes, Sofia Queiroz e Julia Rodrigues) para a disciplina de Machine Learning.

Neste caso, olhando como está o ar de uma cidade **hoje**, a gente tenta adivinhar como ele vai estar **amanhã**. utilizamos dados de 26 cidades da Índia, de 2015 a 2020, e um modelo que prevê a categoria do índice de qualidade do ar (AQI) do dia seguinte: Bom, Satisfatório, Moderado, Ruim, Muito Ruim ou Severo.

O projeto tem duas partes:

- **`backend/`**: modelo. Um script treina tudo e uma pequena API entrega as previsões.
- **`frontend/`**: o site, onde dá para consultar as previsões, ver um mapa e entender como o projeto foi feito.

---

## Requisitos para rodar o projeto

- **Python 3.10 ou mais novo.** Para conferir, rode `python --version` (ou `python3 --version`).
- **Git**, para baixar o projeto.

---

## Passo a passo

### 1. Baixe o projeto

```bash
git clone https://github.com/TheSergioHenrique/AQI-MachineLearning2026-2.git
cd AQI-MachineLearning2026-2
```

### 2. Instale as dependências

Entre na pasta do backend e instale as bibliotecas que o projeto usa:

```bash
cd backend
python -m pip install -r requirements.txt
```

### 3. Treine o modelo

Esse passo só precisa ser feito **uma vez**. Ele lê os dados, treina os modelos e salva tudo na pasta `backend/artefatos/`.

O dataset já vem junto com o projeto, em `backend/dados/city_day.csv`, então é só rodar:

```bash
python treinar.py
```

Se quiser usar outro arquivo, aponte para ele com `--csv caminho/para/city_day.csv`.

Demora menos de um minuto. No final aparece uma mensagem dizendo onde os artefatos foram salvos.

> **De onde vem esse modelo?** O `treinar.py` reproduz o notebook `backend/AQI_city_day_pipeline_dia_seguinte.ipynb`, feito no Colab: mesma limpeza, mesmas variáveis, mesma divisão temporal e mesmos modelos. A diferença é que ele não roda de novo o algoritmo genético (que levou cerca de 1 hora no Colab) e usa direto os melhores hiperparâmetros que o notebook encontrou. Por isso, **se o notebook mudar, o `treinar.py` precisa ser atualizado junto**; o site não pega as mudanças sozinho.

### 4. Ligue a API

Ainda na pasta `backend`:

```bash
python -m uvicorn app:app --port 8000
```

Deixe esse terminal aberto. Enquanto ele estiver rodando, a API fica disponível em `http://localhost:8000`.

Quer ver se está tudo certo? Abra http://localhost:8000/docs no navegador. É uma página onde dá para testar cada rota da API.

### 5. Abra o site

Com a API ligada, abra o arquivo `frontend/index.html` no navegador, com dois cliques mesmo.

Se preferir servir o site, abra **outro terminal** e rode:

```bash
cd frontend
python -m http.server 5500
```

e acesse http://localhost:5500.

---

## O que tem no site

- **Previsão**: escolha uma cidade e uma data para ver o AQI daquele dia e a categoria prevista para o dia seguinte, com a probabilidade de cada categoria. Quando já se sabe o que aconteceu no dia seguinte, o site também mostra se o modelo acertou.
- **Mapa**: todas as cidades de uma vez, coloridas pela categoria prevista, com uma seta indicando se o ar deve piorar ou melhorar.
- **Sobre o Projeto**: como os dados foram tratados, quais modelos testamos, como cada um se saiu e as limitações do trabalho.

---

## Quer saber mais?

- `backend/README.md`: detalhes do modelo e do treino.
- `frontend/README.md`: as rotas da API e o formato das respostas.
- `backend/AQI_city_day_pipeline_dia_seguinte.ipynb`: notebook, com toda a análise e o ajuste dos modelos. É a base do `treinar.py`.

---

## Quem fez

**Grupo 7**: Sergio Henrique, Maria Luisa, Arthur Pontes, Sofia Queiroz e Julia Rodrigues.

Dados: [Air Quality Data in India (2015 a 2020)](https://www.kaggle.com/datasets/rohanrao/air-quality-data-in-india), disponível no Kaggle.
