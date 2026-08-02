export type Coordinates = [number, number];

const LOCATION_KEY = 'rafter:lastLocation';
const DEFAULT_LOCATION: Coordinates = [39.8283, -98.5795];

const isValidCoordinates = (value: unknown): value is Coordinates => (
  Array.isArray(value)
  && value.length === 2
  && value.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate))
);

const readSavedLocation = (): Coordinates | null => {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCATION_KEY) || 'null');
    return isValidCoordinates(saved) ? saved : null;
  } catch {
    return null;
  }
};

const saveLocation = (coordinates: Coordinates) => {
  localStorage.setItem(LOCATION_KEY, JSON.stringify(coordinates));
};

const getBrowserLocation = () => new Promise<Coordinates>((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error('Browser geolocation is unavailable.'));
    return;
  }

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => resolve([coords.latitude, coords.longitude]),
    reject,
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
  );
});

const getIpLocation = async (): Promise<Coordinates> => {
  const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
  if (!response.ok) throw new Error('IP location request failed.');
  const data = await response.json();
  const coordinates: Coordinates = [Number(data.latitude), Number(data.longitude)];
  if (!isValidCoordinates(coordinates)) throw new Error('IP location was invalid.');
  return coordinates;
};

export async function resolveUserLocation(): Promise<{ coordinates: Coordinates; precise: boolean }> {
  try {
    const coordinates = await getBrowserLocation();
    saveLocation(coordinates);
    return { coordinates, precise: true };
  } catch {
    try {
      const coordinates = await getIpLocation();
      saveLocation(coordinates);
      return { coordinates, precise: false };
    } catch {
      return { coordinates: readSavedLocation() || DEFAULT_LOCATION, precise: false };
    }
  }
}
