var Util = {
  formataData: function (iso) {
    var p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  },

  diaSeguinte: function (iso) {
    var d = new Date(iso + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().substr(0, 10);
  },

  faixa: function (categoria) {
    return categoria === null || categoria === undefined ? null : AQI.FAIXAS[categoria];
  },

  selo: function (categoria) {
    var f = Util.faixa(categoria);
    if (!f) return '<span class="selo sem-dados">Sem dados</span>';
    return '<span class="selo" style="background:' + f.cor + ';color:' + f.texto + '">' + f.nome + '</span>';
  },

  numero: function (v, casas) {
    return v === null || v === undefined ? '-' : casas ? v.toFixed(casas) : String(Math.round(v));
  },

  param: function (nome) {
    var m = new RegExp('[?&]' + nome + '=([^&]*)').exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
  },

  preparaData: function (inpData) {
    return AQI.periodo().then(function (p) {
      inpData.min = p.inicio;
      inpData.max = p.fim;
      inpData.value = Util.param('data') || p.fim;
    });
  },

  preparaFiltros: function (selCidade, inpData, aoCarregar) {
    return Promise.all([AQI.cidades(), Util.preparaData(inpData)]).then(function (r) {
      var pedida = (Util.param('cidade') || '').toLowerCase();
      var escolhida = 'Delhi';
      selCidade.innerHTML = r[0].map(function (c) {
        if (pedida && c.nome.toLowerCase().indexOf(pedida) === 0) escolhida = c.nome;
        return '<option>' + c.nome + '</option>';
      }).join('');
      selCidade.value = escolhida;
      if (aoCarregar) aoCarregar();
    });
  },

  erro: function (alvo, e) {
    var msg = e && e.message ? e.message : String(e);
    if (msg === 'Failed to fetch' || msg.indexOf('NetworkError') === 0) {
      msg = 'não foi possível conectar ao servidor. Verifique se o backend está em execução em <code>' + CONFIG.API_BASE_URL + '</code>';
    }
    alvo.innerHTML = '<div class="aviso erro">Erro: ' + msg + '.</div>';
  }
};
