import React, { useState, useRef, useEffect } from "react";
import {
  GoogleMap,
  Marker,
  LoadScript,
  InfoWindow,
} from "@react-google-maps/api";

function VisitMap({ markers, mapCenter }) {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapPolylines, setMapPolylines] = useState([]);
  const [routeMarkers, setRouteMarkers] = useState([]);
    const [routePolyline, setRoutePolyline] = useState(null);

  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  const mapContainerStyle = {
    height: "400px",
    width: "90%",
  };

  useEffect(() => {
    if (mapRef.current && markers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach((marker) =>
        bounds.extend(new window.google.maps.LatLng(marker.lat, marker.lng)),
      );
      mapRef.current.fitBounds(bounds);
    }
  }, [markers]);

  const calculateDirections = async () => {
    // Clear previous polyline
    if (routePolyline) {
      routePolyline.setMap(null);
    }

    if (markers.length > 1) {
      try {
        // Create waypoints for intermediate markers
        const waypoints = markers.slice(1, -1).map((marker) => ({
          location: new window.google.maps.LatLng(marker.lat, marker.lng),
          stopover: true,
        }));

        const origin = new window.google.maps.LatLng(
          markers[0].lat,
          markers[0].lng,
        );
        const destination = new window.google.maps.LatLng(
          markers[markers.length - 1].lat,
          markers[markers.length - 1].lng,
        );

        // Use DirectionsService as it's still supported
        // The warning is just a deprecation notice, not an error
        const directionsService = new window.google.maps.DirectionsService();

        directionsService.route(
          {
            origin: origin,
            destination: destination,
            waypoints: waypoints,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              // Create a custom polyline from the route
              const route = result.routes[0];
              const path = route.overview_path;

              // Create a new polyline
              const polyline = new window.google.maps.Polyline({
                path: path,
                geodesic: true,
                strokeColor: "#FF0000",
                strokeOpacity: 1.0,
                strokeWeight: 3,
                map: mapRef.current,
              });

              setRoutePolyline(polyline);
              setError(null);
            } else {
              setError("Error fetching directions: " + status);
              console.error("Error fetching directions:", status);
            }
          },
        );
      } catch (err) {
        setError("Error fetching directions: " + err.message);
        console.error("Error fetching directions:", err);
      }
    } else {
      setError("At least two markers are required to calculate directions");
    }
  };

  useEffect(() => {
    if (mapRef.current && markers.length > 0) {
      calculateDirections();
    }
  }, [markers, mapRef.current]);

  return (
    <LoadScript
      googleMapsApiKey="AIzaSyBtEmyBwz_YotZK8Iabl_nQQldaAtN0jhM"
      libraries={["routes"]} // Add routes library
    >
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={10}
        onLoad={(map) => (mapRef.current = map)}
      >
        {markers.map(
          (marker, index) =>
            marker &&
            marker.lat &&
            marker.lng && (
              <Marker
                key={index}
                position={{ lat: marker.lat, lng: marker.lng }}
                label={marker.label || ""}
                onClick={() => setSelectedMarker(marker)}
              />
            ),
        )}

        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div>
              <h4>{selectedMarker.companyName}</h4>
              <p>
                <strong>Dealer:</strong> {selectedMarker.dealerName}
              </p>
              <p>
                <strong>Visit Time:</strong> {selectedMarker.visitTime}
              </p>
              <p>
                <strong>Dealer Mobile:</strong> {selectedMarker.mobileNo}
              </p>
            </div>
          </InfoWindow>
        )}

        {error && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              background: "rgba(255, 255, 255, 0.7)",
              padding: "10px",
              borderRadius: "5px",
            }}
          >
            <p style={{ color: "red" }}>{error}</p>
          </div>
        )}
      </GoogleMap>
    </LoadScript>
  );
}

export default VisitMap;
