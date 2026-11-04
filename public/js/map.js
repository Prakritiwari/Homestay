 
	mapboxgl.accessToken = mapToken;
    console.log(mapToken);
    const map = new mapboxgl.Map({
        container: 'map', // container ID
        center: listing.geometry.coordinates, // starting position [lng, lat]. Note that lat must be set between -90 and 90
        zoom: 9 // starting zoom
    });

        const marker1 = new mapboxgl.Marker({color: "red"})
        .setLngLat(listing.geometry.coordinates)
        .setPopup(new mapboxgl.Popup({offset: 25})
        .setHTML(`<h4>${listing.title}</h4><p>Exact location provided after booking</p>`)
        .setMaxWidth("300px"))
        .addTo(map);

        
         map.on('load', () => {
        // Add an image to use as a custom marker
        map.loadImage('/marker.png',
            (error, image) => {
                if (error) throw error;
                map.addImage('custom-marker', image);
                // Add a GeoJSON source for a point
                  map.addSource('point', {
                    'type': 'geojson',
                    'data': {
                        'type': 'FeatureCollection',
                        'features': [
                            {
                                // feature for The listing
                                'type': 'Feature',
                                'geometry': {
                                    'type': 'Point',
                                    'coordinates': listing.geometry.coordinates,
                                },
                                'properties': {
                                    'title': `${listing.title}`
                                }
                            },]
                    
                    }
                });


                // Add a symbol layer
                map.addLayer({
                    'id': 'point',
                    'type': 'symbol',
                    'source': 'point',
                    'layout': {
                        'icon-image': 'custom-marker',
                        // get the title name from the source's "title" property
                        'text-field': ['get', 'title'],
                        'text-font': [
                            'Open Sans Semibold',
                            'Arial Unicode MS Bold'
                        ],
                        'text-offset': [0, 1.25],
                        'text-anchor': 'top'
                    }
                });
            }
        );
    });
    