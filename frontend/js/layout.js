(function () {
  var MENU = [
    { id: 'previsao',  href: 'index.html',     texto: 'Previsão' },
    { id: 'mapa',      href: 'mapa.html',      texto: 'Mapa' },
    { id: 'sobre',     href: 'sobre.html',     texto: 'Sobre o Projeto' }
  ];

  var atual = document.body.getAttribute('data-pagina');
  var item = MENU.filter(function (m) { return m.id === atual; })[0];

  var menuHtml = MENU.map(function (m) {
    return '<li' + (m.id === atual ? ' class="ativo"' : '') + '><a href="' + m.href + '">' + m.texto + '</a></li>';
  }).join('');

  document.body.insertAdjacentHTML('afterbegin',
    '<div id="barra-topo"><div class="interna">' +
      '<span class="dir"><a href="#" id="fonte-menos">A-</a><a href="#" id="fonte-mais">A+</a>' +
      '<a href="sobre.html">Sobre</a></span>' +
    '</div></div>');

  var tamanho = parseInt(localStorage.getItem('fonte') || '12', 10);
  document.body.style.fontSize = tamanho + 'px';
  function ajustaFonte(d) {
    return function (e) {
      e.preventDefault();
      tamanho = Math.min(16, Math.max(10, tamanho + d));
      document.body.style.fontSize = tamanho + 'px';
      localStorage.setItem('fonte', tamanho);
    };
  }
  document.getElementById('fonte-menos').onclick = ajustaFonte(-1);
  document.getElementById('fonte-mais').onclick = ajustaFonte(1);

  document.getElementById('topo').innerHTML =
    '<div id="cabecalho">' +
      '<a id="logo" href="index.html">' +
        '<span class="icone">AQI</span>' +
        '<span class="titulo">Previsão da Qualidade do Ar' +
          '<small>Índice de Qualidade do Ar previsto para o dia seguinte</small></span>' +
      '</a>' +
      '<form id="busca" action="index.html" method="get">' +
        '<input type="text" name="cidade" placeholder="Buscar cidade..."> ' +
        '<input type="submit" value="OK">' +
      '</form>' +
    '</div>' +
    '<ul id="menu">' + menuHtml + '</ul>' +
    '<div id="trilha">Você está em: <a href="index.html">Início</a>' +
      (item && item.id !== 'previsao' ? ' &raquo; ' + item.texto : ' &raquo; Previsão') + '</div>';

  var legenda = AQI.FAIXAS.map(function (f, i) {
    var min = i === 0 ? 0 : AQI.FAIXAS[i - 1].max + 1;
    var faixa = f.max === Infinity ? min + '+' : min + ' a ' + f.max;
    return '<tr><td class="cor" style="background:' + f.cor + '"></td><td>' + faixa + '</td><td>' + f.nome + '</td></tr>';
  }).join('');

  var lateral = document.getElementById('lateral');
  if (lateral) {
    lateral.innerHTML =
      '<div class="caixa"><h3>Navegação</h3><div class="corpo"><ul class="links">' +
        MENU.map(function (m) { return '<li><a href="' + m.href + '">' + m.texto + '</a></li>'; }).join('') +
      '</ul></div></div>' +
      '<div class="caixa"><h3>Escala do AQI (Índia)</h3><div class="corpo">' +
        '<table class="legenda-mini">' + legenda + '</table>' +
        '<p class="pequeno">Fonte: CPCB (Central Pollution Control Board).</p>' +
      '</div></div>' +
      '<div class="caixa"><h3>Base de dados</h3><div class="corpo pequeno">' +
        '<b>Air Quality Data in India</b> (2015 a 2020)<br>' +
        '26 cidades, 29.531 registros diários.<br>' +
        '<a href="https://www.kaggle.com/datasets/rohanrao/air-quality-data-in-india" target="_blank">Ver no Kaggle &raquo;</a>' +
      '</div></div>' +
      (CONFIG.USE_MOCK
        ? '<div class="aviso">Modo de demonstração: os valores exibidos são <b>simulados</b>.</div>'
        : '');
  }

  document.getElementById('rodape-ph').innerHTML =
    '<div id="rodape">' +
      '<div class="links">' +
        MENU.map(function (m) { return '<a href="' + m.href + '">' + m.texto + '</a>'; }).join('') +
      '</div>' +
      '<div class="info">' +
        '<div class="esq"><b>Grupo 7</b>: Sergio Henrique, Maria Luisa, Arthur Pontes, Sofia Queiroz e Julia Rodrigues<br>' +
        'Projeto acadêmico de Machine Learning &middot; 2026</div>' +
      '</div>' +
    '</div>';
})();
