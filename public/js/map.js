(function () {
  const mapContainer = document.getElementById("map");
  const hasCoordinates =
    typeof listing !== "undefined" &&
    listing &&
    listing.geometry &&
    Array.isArray(listing.geometry.coordinates) &&
    listing.geometry.coordinates.length === 2;

  if (!mapContainer || !hasCoordinates || typeof mapToken === "undefined") {
    return;
  }

  mapboxgl.accessToken = mapToken;

  const coordinates = listing.geometry.coordinates;
  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: coordinates,
    zoom: 11,
    cooperativeGestures: true,
  });

  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

  new mapboxgl.Marker({ color: "#fe424d" })
    .setLngLat(coordinates)
    .setPopup(
      new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<h4 style="margin:0 0 4px;">${listing.title}</h4><p style="margin:0;color:#6b7280;font-size:13px;">Exact location provided after booking</p>`
      ).setMaxWidth("300px")
    )
    .addTo(map);
})();
