// Helpers and such

$(document).ready( function() {
    new FastClick(document.body);
});

L.utfGrid = function(url, options) {
    return new L.UtfGrid(url, options);
};

function getParamByName(name) {
    var _name = name.replace(/[\[]/, '\\\\[').replace(/[\]]/, '\\\\]');
    var regex = new RegExp('[\\?&]' + _name + '=([^&#]*)');
    var results = regex.exec(window.location.href);
    if(results === null) { return null; }
    return decodeURIComponent(results[1].replace(/\+/g, ' '));
}

var iOS = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );
var svg = !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect;

// end Helpers

var map, map_settings, layers, zoomer, grid;
var MAPBOX_TILE_ID;
var width;
var location_marker = L.marker();
var hidden_marker = L.marker();
var popup = L.popup();

var $header = $('#main-nav');
var $footer = $('#control-nav');
var $popup = $('#popup');
var $well_id = $('#well-id');
var $find_me = $('#find-me');
var $geo_input = $('#geo-input');
var $geo_fire = $('#geo-fire');

if (!navigator.geolocation) {
    $find_me.hide();
}

if(!svg) {
    $header.find('img').attr('src', 'http://s3.amazonaws.com/static.texastribune.org/common/tt_disposal_wells/images/txtrib-logo-white-271x30px.png');
}

map_settings = {  // base settings optimized for mobile
    center: [31.5, -100.0],
    zoom: 5,
    minZoom: 5,
    maxZoom: 14,
    scrollWheelZoom: false,
    attributionControl: false,
    zoomControl: false
};

width = $(window).width();

if (width >= 959) {
    map_settings.center = [31.784, -101.668];
    map_settings.zoom = 6;
}

if (width >= 1300) {
    map_settings.center = [31.784, -100.668];
    map_settings.zoom = 7;
}

map = L.map('map', map_settings);

zoomer = L.control.zoom({
    position: 'topright'
}).addTo(map);

grid = gridLayerGenerator('texastribune.texas-disposal-well-hex');

if (window.devicePixelRatio > 1) {
    layers = L.layerGroup([
        L.tileLayer('http://{s}.tiles.mapbox.com/v3/texastribune.map-yvp767oc,texastribune.texas-disposal-well-hex/{z}/{x}/{y}.png', { detectRetina: true }),
        grid
    ]);

    map.options.maxZoom -= 1;
    map.options.minZoom -= 1;
}

if (window.devicePixelRatio === 1 || !window.devicePixelRatio) {
    layers = L.layerGroup([
        L.tileLayer('http://{s}.tiles.mapbox.com/v3/texastribune.map-sit023yd,texastribune.texas-disposal-well-hex/{z}/{x}/{y}.png', { detectRetina: true }),
        grid
    ]);
}

map.addLayer(layers);

$find_me.on('click', function() {
    $find_me.find('i').removeClass().addClass('icon-refresh icon-spin');
    navigator.geolocation.getCurrentPosition( function(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        geocode(lat + ', ' + lng);
        $find_me.find('i').removeClass().addClass('icon-map-marker');
    }, function(error) {
        $find_me.find('i').removeClass().addClass('icon-remove');
        alert('There was a problem! Please try using the search box instead.');
    });
});

$('#geo-locate').on('submit', function(e) {
    geocode($geo_input.val());
    e.preventDefault();
});

$geo_fire.on('click', function() {
    var val = $geo_input.val();
    if (!val) {
        return false;
    }

    geocode(val);
});

$('#about-button').on('click', function() {
    $modal_body = $('.about-body');
    if($modal_body.children().length < 1) {
        $modal_body.html($('#about-blurb-body').html());
    }
});

if(iOS) {
    $geo_input.on('blur', function(e) {
        setTimeout(function() {
            $('body').css('height', '+=1').css('height', '-=1');
        }, 0);
    });
}

function geocode(request) {
  $.ajax({
    url: 'http://open.mapquestapi.com/nominatim/v1/search?format=json&countrycodes=us&limit=1&addressdetails=1&q=' + request,
    cache: false,
    dataType: 'jsonp',
    jsonp: 'json_callback',
    success: function(response) {
      result = response[0];
      if (result === undefined) {
         alert('A location could not be found. Please try searching for a ZIP Code.');
         return false;
      } else {
        var lat = result.lat,
            lng = result.lon,
            state = result.address.state;
        if (state !== 'Texas') {
          alert('The address that returned is not in Texas. Please try making your query more detailed.');
        }

        checkGeoAgainstGrid(lat, lng);
      }
    }
  });
}

function checkGeoAgainstGrid(lat, lng) {
    var loc = L.latLng(lat, lng);
    map.setView(loc, 10);

    grid.dataForLatLng(loc, function(d) {
        if (d.data['count'] === 0) {
            popup.setLatLng(loc).setContent('<div># of Wells: 0</div>').openOn(map);
            return false;
        }

        popup.setLatLng(loc).setContent('<div># of Wells: ' + d.data['count'] + '</div>').openOn(map);
    });
}

function gridLayerGenerator(gridID) {
    var gridLayer = L.utfGrid('http://{s}.tiles.mapbox.com/v3/' + gridID + '/{z}/{x}/{y}.grid.json?callback={cb}');

    gridLayer.on('click', function(e) {
        if (!e.data) { return false; }

        gridLayer.dataForLatLng(e.latlng, function(d) {
            if (d.data['count'] === 0) { return false; }
            map.panTo(e.latlng);
            if (map.getZoom() <= 6) {
                map.setZoom(10);
            }

            popup.setLatLng(e.latlng).setContent('<div># of Wells: ' + d.data['count'] + '</div>').openOn(map);
        });
    });

    return gridLayer;
}

if (getParamByName('lat') && getParamByName('lng')) {
    checkGeoAgainstGrid(parseFloat(getParamByName('lat')), parseFloat(getParamByName('lng')));
}

if (getParamByName('embed') === 'true') {
    $('div.leaflet-control-zoom').addClass('leaflet-control-zoom-override');
}
