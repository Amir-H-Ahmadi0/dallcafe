export function getPhoneNumbers(value: string) {
  return [...new Set(value.split(/[,\n،;；]+/).map((phone) => phone.trim()).filter(Boolean))];
}

export function getPhoneLink(phone: string) {
  return `tel:${phone.replace(/[^0-9+]/g, '')}`;
}
