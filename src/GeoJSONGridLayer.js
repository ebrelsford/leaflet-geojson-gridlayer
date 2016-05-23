/*
 * Leaflet.GeoJSONGridLayer 
 */

(function () {

    var console = window.console || {
        error: function () {},
        warn: function () {}
    };

    function defineLeafletGeoJSONGridLayer(L) {
        L.GeoJSONGridLayer = L.GridLayer.extend({
            initialize: function (url, options) {
                L.GridLayer.prototype.initialize.call(this, options);

                this._url = url;
                this._geojsons = {};
            },

            onAdd: function (map) {
                L.GridLayer.prototype.onAdd.call(this, map);
            },

            createTile: function (coords, done) {
                var tile = L.DomUtil.create('div', 'leaflet-tile');
                var size = this.getTileSize();
                tile.width = size.x;
                tile.height = size.y;

                this.fetchTile(coords, function (error) {
                    done(error, tile);
                });
                return tile;
            },

            fetchTile: function (coords, done) {
                var tileUrl = L.Util.template(this._url, coords);
                var tileLayer = this;

                var request = new XMLHttpRequest();
                request.open('GET', tileUrl, true);

                request.onload = function () {
                    if (request.status >= 200 && request.status < 400) {
                        var data = JSON.parse(request.responseText);
                        tileLayer.addData(data);
                        done(null);
                    } else {
                        // We reached our target server, but it returned an error
                        done(request.statusText);
                    }
                };

                request.onerror = function () {
                    done(request.statusText);
                };

                request.send();
            },

            hasLayerWithId: function (sublayer, id) {
                if (!this._geojsons[sublayer]) return false;
                var layers = this._geojsons[sublayer].getLayers();
                for (var i = 0; i < layers.length; i++) {
                    if (layers[i].feature.id === id || layers[i].feature.properties.id === id) {
                        return true;
                    }
                }
                return false;
            },

            addData: function (data) {
                if (data.type === 'FeatureCollection') {
                    this.addSubLayerData('default', data);
                }
                else {
                    var tileLayer = this;
                    Object.keys(data).forEach(function (key) {
                        tileLayer.addSubLayerData(key, data[key]);
                    });
                }
            },

            addSubLayerData: function (sublayer, data) {
                if (!this._geojsons[sublayer]) {
                    this._geojsons[sublayer] = new L.geoJson(null, this.options.layers[sublayer]).addTo(this._map);
                }
                var toAdd = data.features.filter(function (feature) {
                    return !this.hasLayerWithId(sublayer, feature.id ? feature.id : feature.properties.id);
                }, this);
                this._geojsons[sublayer].addData({
                    type: 'FeatureCollection',
                    features: toAdd
                });
            }
        });

        L.geoJsonGridLayer = function(url, options) {
            return new L.GeoJSONGridLayer(url, options);
        };
    }

    if (typeof define === 'function' && define.amd) {
        // Try to add leaflet.loading to Leaflet using AMD
        define(['leaflet'], function (L) {
            defineLeafletGeoJSONGridLayer(L);
        });
    }
    else {
        // Else use the global L
        defineLeafletGeoJSONGridLayer(L);
    }

})();
