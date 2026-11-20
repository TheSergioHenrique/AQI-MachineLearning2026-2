var Util = {
  DATA_MIN: '2015-01-01',
  DATA_MAX: '2020-06-30',

  formataData: function (iso) {
    var p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  },

  selo: function (aqi) {
    var f = AQI.faixa(aqi);
    return '<span class="selo" style="background:' + f.cor + ';color:' + f.texto + '">' + f.nome + '</span>';
  },

  param: function (nome) {
    var m = new RegExp('[?&]' + nome + '=([^&]*)').exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
  },

  preparaFiltros: function (selCidade, inpData, aoCarregar) {
    inpData.min = Util.DATA_MIN;
    inpData.max = Util.DATA_MAX;
    inpData.value = Util.param('data') || Util.DATA_MAX;

    return AQI.cidades().then(function (lista) {
      var pedida = (Util.param('cidade') || '').toLowerCase();
      var escolhida = 'Delhi';
      selCidade.innerHTML = lista.map(function (c) {
        if (pedida && c.nome.toLowerCase().indexOf(pedida) === 0) escolhida = c.nome;
        return '<option>' + c.nome + '</option>';
      }).join('');
      selCidade.value = escolhida;
      if (aoCarregar) aoCarregar();
    });
  },

  erro: function (alvo, e) {
    alvo.innerHTML = '<div class="aviso erro">Não foi possível obter os dados do servidor (' +
      (e && e.message ? e.message : e) + '). Verifique se o backend está em execução em <code>' +
      CONFIG.API_BASE_URL + '</code>.</div>';
  }
};
