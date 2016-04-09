function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  var jeSlika = aliVsebujeSliko(sporocilo);
  var jeVideo = jePovezavaNaVideo(sporocilo);
  if (jeSmesko | jeSlika | jeVideo) {
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  }
  return $('<div style="font-weight: bold;"></div>').text(sporocilo);
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  vsebujeSliko=false;
  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    sporocilo = povezavaNaSliko(sporocilo);
    sporocilo = povezavaNaVideo(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

var vsebujeSliko=false;
function povezavaNaSliko(vhod) {
  var besedeNaVhodu = [];
  besedeNaVhodu=vhod.split(" ");
  besedeIzhod=vhod;
  for (var i in besedeNaVhodu) {
    if(besedeNaVhodu[i].search("http://") == 0 | besedeNaVhodu[i].search("https://") == 0){
      if (besedeNaVhodu[i].indexOf(".jpg") == besedeNaVhodu[i].length-4 | besedeNaVhodu[i].indexOf(".png") == besedeNaVhodu[i].length-4 | besedeNaVhodu[i].indexOf(".gif") == besedeNaVhodu[i].length-4) {
        besedeIzhod= besedeIzhod + '  <img src="'+besedeNaVhodu[i]+'"width="200px" style="PADDING-LEFT: 20px">';
        vsebujeSliko=true;
      }
    }
  }
  return besedeIzhod;
}

function aliVsebujeSliko(vhod){
  var besedeNaVhodu = [];
  besedeNaVhodu=vhod.split(" ");
  besedeIzhod=vhod;
  for (var i in besedeNaVhodu) {
    if(besedeNaVhodu[i].search("http://") == 0 | besedeNaVhodu[i].search("https://") == 0){
      if (besedeNaVhodu[i].indexOf(".jpg") == besedeNaVhodu[i].length-4 | besedeNaVhodu[i].indexOf(".png") == besedeNaVhodu[i].length-4 | besedeNaVhodu[i].indexOf(".gif") == besedeNaVhodu[i].length-4) {
        return true;
      }
    }
  }
  return false;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    
    $('#seznam-uporabnikov div').click(function() {
      $('#poslji-sporocilo').val($('#poslji-sporocilo').val() + ('/zasebno ' + '"'+$(this).text() +'"'));
      $('#poslji-sporocilo').focus();
    });
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}

function povezavaNaVideo(vhod){
  var video_link = /https?:\/\/www\.youtube\.com\/watch\?v\=(\S+)/g;
  var besedeNaVhodu=[];
  besedeNaVhodu=vhod.split(" ");
  besedeIzhod=vhod;
  for (var i in besedeNaVhodu) {
    if(besedeNaVhodu[i].search(video_link) == 0 ){
      var indeks_zacetka= (besedeNaVhodu[i]).lastIndexOf("://www.youtube.com/watch?v=");
      var dolzina=(besedeNaVhodu[i]).length;
      var video_id= (besedeNaVhodu[i]).substring(indeks_zacetka+27,dolzina);
      besedeIzhod+= '<iframe class="video_link" src="https://www.youtube.com/embed/'+video_id+'" allowfullscreen></iframe>';
    }
  }
  return besedeIzhod;
}
function jePovezavaNaVideo(vhod){
  var video_link = /https?:\/\/www\.youtube\.com\/watch\?v\=(\S+)/g;
  var besedeNaVhodu=[];
  besedeNaVhodu=vhod.split(" ");
  besedeIzhod=vhod;
  for (var i in besedeNaVhodu) {
    if(besedeNaVhodu[i].search(video_link) == 0 ){
      return true;
    }
  }
  return false;
}
