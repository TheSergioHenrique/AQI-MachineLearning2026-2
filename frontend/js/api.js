var AQI = (function () {

  var FAIXAS = [
    { max: 50,       nome: 'Bom',          cor: '#009933', texto: '#fff', saude: 'Impacto mínimo.' },
    { max: 100,      nome: 'Satisfatório', cor: '#58c322', texto: '#000', saude: 'Desconforto leve para pessoas sensíveis.' },
    { max: 200,      nome: 'Moderado',     cor: '#f2e600', texto: '#000', saude: 'Desconforto respiratório para asmáticos, cardíacos, crianças e idosos.' },
    { max: 300,      nome: 'Ruim',         cor: '#ff9900', texto: '#000', saude: 'Desconforto respiratório para a maioria das pessoas em exposição prolongada.' },
    { max: 400,      nome: 'Muito Ruim',   cor: '#e60000', texto: '#fff', saude: 'Doenças respiratórias em exposição prolongada.' },
    { max: Infinity, nome: 'Severo',       cor: '#7e0023', texto: '#fff', saude: 'Afeta pessoas saudáveis e agrava quem já tem doenças.' }
  ];

  function faixa(aqi) {
    for (var i = 0; i < FAIXAS.length; i++) {
      if (aqi <= FAIXAS[i].max) return FAIXAS[i];
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
      if (!r.ok) throw new Error('HTTP ' + r.status);
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

  var mock = {
    cidades: function () {
      return atraso(Object.keys(MEDIANAS).map(function (c) { return { nome: c }; }));
    },
    previsao: function (cidade, data) {
      var hoje = aqiSimulado(cidade, data);
      var amanha = Math.round(hoje * 0.7 + aqiSimulado(cidade, somaDias(data, 1)) * 0.3);
      var s = function (k) { return semente(cidade + data + k); };
      return atraso({
        cidade: cidade,
        data_base: data,
        data_prevista: somaDias(data, 1),
        aqi_atual: hoje,
        aqi_previsto: amanha,
        modelo: 'Árvore de Regressão',
        mae_modelo: 28.4,
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
        lista.push({ data: d, aqi: aqiSimulado(cidade, d) });
      }
      return atraso(lista);
    },
    modelos: function () {
      return atraso([
        { modelo: 'Baseline (AQI amanhã = hoje)', mae: 34.1, rmse: 58.7 },
        { modelo: 'Regressão Linear',             mae: 31.2, rmse: 52.3 },
        { modelo: 'KNN Regressor',                mae: 30.5, rmse: 51.0 },
        { modelo: 'Árvore de Regressão',          mae: 28.4, rmse: 49.6 },
        { modelo: 'SVR',                          mae: 29.1, rmse: 50.2 }
      ]);
    }
  };

  mock.mapa = function (data) {
    return mock.cidades().then(function (lista) {
      return Promise.all(lista.map(function (c) { return mock.previsao(c.nome, data); }));
    }).then(function (prevs) {
      return prevs.map(function (p) {
        return { cidade: p.cidade, aqi_atual: p.aqi_atual, aqi_previsto: p.aqi_previsto };
      });
    });
  };

  var real = {
    cidades:   function () { return get('/cidades'); },
    previsao:  function (c, d) { return get('/previsao?cidade=' + encodeURIComponent(c) + '&data=' + d); },
    historico: function (c, d, n) { return get('/historico?cidade=' + encodeURIComponent(c) + '&data=' + d + '&dias=' + n); },
    modelos:   function () { return get('/modelos'); },
    mapa:      function (d) { return get('/mapa?data=' + d); }
  };

  var fonte = CONFIG.USE_MOCK ? mock : real;

  return {
    FAIXAS: FAIXAS,
    faixa: faixa,
    cidades: fonte.cidades,
    previsao: fonte.previsao,
    historico: fonte.historico,
    mapa: fonte.mapa,
    COORDENADAS: COORDENADAS,
    modelos: fonte.modelos
  };
})();
