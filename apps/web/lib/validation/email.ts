const localPartPattern = /^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$/i;

export function isValidLocalPart(value: string) {
  return localPartPattern.test(value) && !value.includes("..");
}

export function buildAddress(localPart: string, domain: string) {
  return `${localPart.toLowerCase()}@${domain.toLowerCase()}`;
}
