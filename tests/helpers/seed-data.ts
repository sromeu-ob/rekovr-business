import { E2E_PREFIX, TEST_LOCATION } from './constants';

/** Factory for a C2C lost item that will match with the B2B found item */
export function makeLostItem(suffix: string = '') {
  return {
    type: 'lost',
    title: `${E2E_PREFIX} Lost Gold Watch${suffix}`,
    description:
      'A gold analog wristwatch with a brown leather strap and round face. It has Roman numeral markings and a small date window. Lost near the park entrance.',
    ...TEST_LOCATION,
    address: TEST_LOCATION.address,
    date_time: new Date().toISOString().slice(0, 16),
  };
}

/** Factory for a B2B found item that will match with the C2C lost item */
export function makeFoundItem(suffix: string = '') {
  return {
    title: `${E2E_PREFIX} Gold Watch found at park${suffix}`,
    description:
      'Found a gold analog wristwatch with brown leather strap near the main park entrance. Round face with Roman numerals and date display.',
    latitude: TEST_LOCATION.latitude + 0.001, // Slightly offset but within 10km
    longitude: TEST_LOCATION.longitude + 0.001,
    address: 'Parc de la Ciutadella, Barcelona',
    date_time: new Date().toISOString().slice(0, 16),
  };
}

/** Factory for a second pair of items (for reject test) */
export function makeLostItem2() {
  return {
    type: 'lost',
    title: `${E2E_PREFIX} Lost Blue Backpack`,
    description:
      'A navy blue Herschel backpack with a laptop compartment. Contains a water bottle and notebook. Lost at the train station.',
    ...TEST_LOCATION,
    address: TEST_LOCATION.address,
    date_time: new Date().toISOString().slice(0, 16),
  };
}

export function makeFoundItem2() {
  return {
    title: `${E2E_PREFIX} Blue Backpack found at station`,
    description:
      'Found a navy blue Herschel backpack near the train station platform. Has a laptop compartment with a water bottle inside.',
    latitude: TEST_LOCATION.latitude + 0.002,
    longitude: TEST_LOCATION.longitude + 0.002,
    address: 'Estació de Sants, Barcelona',
    date_time: new Date().toISOString().slice(0, 16),
  };
}
