import { TileLayer } from 'react-leaflet';

/** Shared high-resolution satellite basemap for both canvassing experiences. */
export function SatelliteTileLayer() {
  return (
    <TileLayer
      url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
      attribution='Imagery &copy; <a href="https://www.google.com/maps">Google Maps</a>'
      maxNativeZoom={20}
      maxZoom={21}
    />
  );
}
