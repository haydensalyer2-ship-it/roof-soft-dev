import { LayersControl, TileLayer } from 'react-leaflet';

/** Shared high-resolution satellite basemap for both canvassing experiences. */
export function SatelliteTileLayer() {
  return (
    <LayersControl position="topright">
      <LayersControl.BaseLayer checked name="Satellite + labels">
        <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" attribution='Imagery &copy; <a href="https://www.google.com/maps">Google Maps</a>' maxNativeZoom={20} maxZoom={21} />
      </LayersControl.BaseLayer>
      <LayersControl.BaseLayer name="Esri satellite">
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community" maxNativeZoom={19} maxZoom={21} />
      </LayersControl.BaseLayer>
      <LayersControl.BaseLayer name="Street map">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' maxNativeZoom={19} maxZoom={21} />
      </LayersControl.BaseLayer>
      <LayersControl.Overlay name="Roads & places">
        <TileLayer url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" attribution="Esri reference data" maxNativeZoom={19} maxZoom={21} />
      </LayersControl.Overlay>
    </LayersControl>
  );
}
