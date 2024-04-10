
mapboxgl.accessToken = 'pk.eyJ1IjoiaXNhbnRvc28yNCIsImEiOiJjbHJoMnpqa28wM3g2MmptZjNhY2I0azZ4In0.hf_HgbByCza1aIBdbbbaOw';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    projection: 'globe', // Display the map as a globe, since satellite-v9 defaults to Mercator
    zoom: 1.5,
    center: [-90, 40]
});

map.on('style.load', () => {
    map.setFog({}); // Set the default atmosphere style
    map.addLayer({ //set the bathymetry style
        "id": "depth",
        "type": "fill",
        "paint": {
            "fill-color": [
                "interpolate",
                [
                    "linear"
                ],
                [
                    "get",
                    "min_depth"
                ],
                0,
                "hsl(201, 93%, 54%)",
                684,
                "hsl(201, 94%, 45%)",
                1932,
                "hsl(201, 94%, 37%)",
                3217,
                "hsl(201, 95%, 31%)",
                4327,
                "hsl(201, 94%, 23%)",
                5731,
                "hsl(201, 93%, 17%)",
                7000,
                "hsl(201, 94%, 15%)"
            ]
        },
        "layout": {},
        "source": "composite",
        "source-layer": "depth"
    })
});
map.on('click', function(event){
    map.addSource('loc-df', { //set the geojson
        type : 'geojson',
        data : 'Geojson data/loc_df.geojson' //path for the json make sure to check the console (cmd + opt +J)
    });
    map.addLayer({ //this is the way to add geojson layer to show up
        "id": "loc-df",
        "minzoom": 0,
        "maxzoom": 22,
        "type": "circle",
        "paint": {
            "circle-color": "hsl(24, 69%, 31%)"
        },
        "layout": {},
        "source": "loc-df",
    });
});
    // The following values can be changed to control rotation speed:

    // At low zooms, complete a revolution every two minutes.
    const secondsPerRevolution = 120;
    // Above zoom level 5, do not rotate.
    const maxSpinZoom = 5;
    // Rotate at intermediate speeds between zoom levels 3 and 5.
    const slowSpinZoom = 3;

    let userInteracting = false;
    let spinEnabled = true;

    function spinGlobe() {
        const zoom = map.getZoom();
        if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
            let distancePerSecond = 360 / secondsPerRevolution;
            if (zoom > slowSpinZoom) {
                // Slow spinning at higher zooms
                const zoomDif =
                    (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
                distancePerSecond *= zoomDif;
            }
            const center = map.getCenter();
            center.lng -= distancePerSecond;
            // Smoothly animate the map over one second.
            // When this animation is complete, it calls a 'moveend' event.
            map.easeTo({ center, duration: 1000, easing: (n) => n });
        }
    }

    // Pause spinning on interaction
    map.on('mousedown', () => {
        userInteracting = true;
    });

    // Restart spinning the globe when interaction is complete
    map.on('mouseup', () => {
        userInteracting = false;
        spinGlobe();
    });

    // These events account for cases where the mouse has moved
    // off the map, so 'mouseup' will not be fired.
    map.on('dragend', () => {
        userInteracting = false;
        spinGlobe();
    });
    map.on('pitchend', () => {
        userInteracting = false;
        spinGlobe();
    });
    map.on('rotateend', () => {
        userInteracting = false;
        spinGlobe();
    });

    // When animation is complete, start spinning if there is no ongoing interaction
    map.on('moveend', () => {
        spinGlobe();
    });

    document.getElementById('btn-spin').addEventListener('click', (e) => {
        spinEnabled = !spinEnabled;
        if (spinEnabled) {
            spinGlobe();
            e.target.innerHTML = 'Pause rotation';
        } else {
            map.stop(); // Immediately end ongoing animation
            e.target.innerHTML = 'Start rotation';
        }
    });

    spinGlobe();
     // Add zoom and rotation controls to the map.
    map.addControl(
            new MapboxGeocoder({
                accessToken: mapboxgl.accessToken,
                mapboxgl: mapboxgl
            })
);
    map.on('click', () => { //i dont know why its not working
        // Fetch GeoJSON data from the source
        var pointsData = map.getSource('loc-df')._data;

        // Generate LineString from points using Turf.js
        var lineString = turf.lineString(pointsData.features.map(feature => feature.geometry.coordinates));

        // Add LineString to the map
        map.addSource('line', {
            type: 'geojson',
            data: lineString
        });

        map.addLayer({
            id: 'line',
            type: 'line',
            source: 'line',
            paint: {
                'line-color': '#0000FF',
                'line-width': 2
            }
        });
    });
    map.addControl(new mapboxgl.NavigationControl());
    map.addControl(new mapboxgl.FullscreenControl());