var AQI = (function () {

  var FAIXAS = [
    { max: 50,       nome: 'Bom',          cor: '#009933', texto: '#fff', saude: 'Impacto mínimo.' },
    { max: 100,      nome: 'Satisfatório', cor: '#58c322', texto: '#000', saude: 'Desconforto leve para pessoas sensíveis.' },
    { max: 200,      nome: 'Moderado',     cor: '#f2e600', texto: '#000', saude: 'Desconforto respiratório para asmáticos, cardíacos, crianças e idosos.' },
    { max: 300,      nome: 'Ruim',         cor: '#ff9900', texto: '#000', saude: 'Desconforto respiratório para a maioria das pessoas em exposição prolongada.' },
    { max: 400,      nome: 'Muito Ruim',   cor: '#e60000', texto: '#fff', saude: 'Doenças respiratórias em exposição prolongada.' },
    { max: Infinity, nome: 'Severo',       cor: '#7e0023', texto: '#fff', saude: 'Afeta pessoas saudáveis e agrava quem já tem doenças.' }
  ];

  function indice(aqi) {
    for (var i = 0; i < FAIXAS.length; i++) {
      if (aqi <= FAIXAS[i].max) return i;
    }
  }

  var COORDENADAS = {
    Ahmedabad: [23.0225, 72.5714], Aizawl: [23.7271, 92.7176], Amaravati: [16.5131, 80.5165],
    Amritsar: [31.6340, 74.8723], Bengaluru: [12.9716, 77.5946], Bhopal: [23.2599, 77.4126],
    Brajrajnagar: [21.8167, 83.9167], Chandigarh: [30.7333, 76.7794], Chennai: [13.0827, 80.2707],
    Coimbatore: [11.0168, 76.9558], Delhi: [29.0500, 77.6500], Ernakulam: [10.2000, 75.8000],
    Gurugram: [28.0500, 76.6000], Guwahati: [26.4000, 91.6000], Hyderabad: [17.3850, 78.4867],
    Jaipur: [26.9124, 75.7873], Jorapokhar: [23.7000, 86.4100], Kochi: [9.4500, 76.2500],
    Kolkata: [22.5726, 88.3639], Lucknow: [26.8467, 80.9462], Mumbai: [19.0760, 72.8777],
    Patna: [25.5941, 85.1376], Shillong: [25.3500, 92.0500], Talcher: [20.9500, 85.2333],
    Thiruvananthapuram: [8.5241, 76.9366], Visakhapatnam: [17.6868, 83.2185]
  };

  function get(caminho) {
    return fetch(CONFIG.API_BASE_URL + caminho).then(function (r) {
      if (!r.ok) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          throw new Error(j.detail || 'HTTP ' + r.status);
        });
      }
      return r.json();
    });
  }

  var MEDIANAS = {
    Ahmedabad: 384, Aizawl: 23, Amaravati: 78, Amritsar: 101, Bengaluru: 86, Bhopal: 120,
    Brajrajnagar: 122, Chandigarh: 82, Chennai: 100, Coimbatore: 75, Delhi: 257, Ernakulam: 94,
    Gurugram: 208, Guwahati: 98, Hyderabad: 104, Jaipur: 122, Jorapokhar: 133, Kochi: 99,
    Kolkata: 94, Lucknow: 198, Mumbai: 91, Patna: 215, Shillong: 48, Talcher: 128,
    Thiruvananthapuram: 68, Visakhapatnam: 106
  };

  function semente(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    var x = Math.sin(h) * 10000;
    return x - Math.floor(x);
  }

  function aqiSimulado(cidade, dataISO) {
    var base = MEDIANAS[cidade] || 100;
    var mes = parseInt(dataISO.substr(5, 2), 10);
    var saz = { 1: 1.4, 2: 1.2, 3: 1.0, 4: 0.95, 5: 0.9, 6: 0.75, 7: 0.6, 8: 0.55, 9: 0.65, 10: 1.1, 11: 1.5, 12: 1.45 }[mes];
    var ruido = 0.75 + semente(cidade + dataISO) * 0.5;
    return Math.max(10, Math.round(base * saz * ruido));
  }

  function somaDias(dataISO, n) {
    var d = new Date(dataISO + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().substr(0, 10);
  }

  function atraso(valor) {
    return new Promise(function (ok) { setTimeout(function () { ok(valor); }, 250); });
  }

  function previsaoSimulada(cidade, data) {
    var hoje = aqiSimulado(cidade, data);
    return indice(Math.round(hoje * 0.7 + aqiSimulado(cidade, somaDias(data, 1)) * 0.3));
  }

  var mock = {
    cidades: function () {
      return atraso(Object.keys(MEDIANAS).map(function (c) { return { nome: c }; }));
    },
    periodo: function () {
      return atraso({ inicio: '2015-01-01', fim: '2020-07-01' });
    },
    previsao: function (cidade, data) {
      var hoje = aqiSimulado(cidade, data);
      var prevista = previsaoSimulada(cidade, data);
      var s = function (k) { return semente(cidade + data + k); };
      var probs = FAIXAS.map(function (f, i) { return Math.exp(-2 * Math.abs(i - prevista)); });
      var soma = probs.reduce(function (a, b) { return a + b; }, 0);
      return atraso({
        cidade: cidade,
        data_base: data,
        data_prevista: somaDias(data, 1),
        aqi_atual: hoje,
        categoria_atual: indice(hoje),
        categoria_prevista: prevista,
        probabilidades: probs.map(function (p) { return p / soma; }),
        categoria_real: data < '2020-07-01' ? indice(aqiSimulado(cidade, somaDias(data, 1))) : null,
        conjunto: data <= '2018-12-31' ? 'treino' : data <= '2019-12-31' ? 'validação' : 'teste',
        modelo: 'Random Forest',
        f1_modelo: 0.7249,
        poluentes: {
          'PM2.5': +(hoje * (0.45 + s('a') * 0.2)).toFixed(2),
          'PM10': +(hoje * (0.8 + s('b') * 0.3)).toFixed(2),
          'NO': +(5 + s('c') * 25).toFixed(2),
          'NO2': +(10 + s('d') * 40).toFixed(2),
          'NOx': +(15 + s('e') * 50).toFixed(2),
          'NH3': +(8 + s('f') * 30).toFixed(2),
          'CO': +(0.4 + s('g') * 2).toFixed(2),
          'SO2': +(5 + s('h') * 20).toFixed(2),
          'O3': +(15 + s('i') * 40).toFixed(2),
          'Benzene': +(0.5 + s('j') * 4).toFixed(2),
          'Toluene': +(1 + s('k') * 10).toFixed(2)
        }
      });
    },
    historico: function (cidade, data, dias) {
      var lista = [];
      for (var i = dias - 1; i >= 0; i--) {
        var d = somaDias(data, -i);
        var aqi = aqiSimulado(cidade, d);
        lista.push({ data: d, aqi: aqi, categoria: indice(aqi) });
      }
      return atraso(lista);
    },
    mapa: function (data) {
      return atraso(Object.keys(MEDIANAS).map(function (c) {
        var aqi = aqiSimulado(c, data);
        return { cidade: c, aqi_atual: aqi, categoria_atual: indice(aqi), categoria_prevista: previsaoSimulada(c, data) };
      }));
    },
    modelos: function () {
      return atraso({
        divisao: { treino_ate: '2018-12-31', validacao_ate: '2019-12-31' },
        resultados: [
          { modelo: 'Persistência (amanhã = hoje)', f1_macro: 0.6964, acc: 0.7739, bal_acc: 0.6989, adj: 0.9938, escolhido: false },
          { modelo: 'Regressão Logística', f1_macro: 0.6893, acc: 0.7215, bal_acc: 0.7593, adj: 0.9917, escolhido: false },
          { modelo: 'Árvore de Decisão',   f1_macro: 0.6913, acc: 0.7171, bal_acc: 0.7530, adj: 0.9887, escolhido: false },
          { modelo: 'Random Forest',       f1_macro: 0.7249, acc: 0.7527, bal_acc: 0.7825, adj: 0.9958, escolhido: true },
          { modelo: 'KNN',                 f1_macro: 0.6682, acc: 0.7259, bal_acc: 0.6727, adj: 0.9922, escolhido: false },
          { modelo: 'SVM',                 f1_macro: 0.7309, acc: 0.7469, bal_acc: 0.7815, adj: 0.9924, escolhido: false }
        ]
      });
    }
  };

  var real = {
    cidades:   function () { return get('/cidades'); },
    periodo:   function () { return get('/periodo'); },
    previsao:  function (c, d) { return get('/previsao?cidade=' + encodeURIComponent(c) + '&data=' + d); },
    historico: function (c, d, n) { return get('/historico?cidade=' + encodeURIComponent(c) + '&data=' + d + '&dias=' + n); },
    mapa:      function (d) { return get('/mapa?data=' + d); },
    modelos:   function () { return get('/modelos'); }
  };

  var fonte = CONFIG.USE_MOCK ? mock : real;

  return {
    FAIXAS: FAIXAS,
    COORDENADAS: COORDENADAS,
    indice: indice,
    cidades: fonte.cidades,
    periodo: fonte.periodo,
    previsao: fonte.previsao,
    historico: fonte.historico,
    mapa: fonte.mapa,
    modelos: fonte.modelos
  };
})();
