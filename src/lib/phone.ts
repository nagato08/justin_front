/** Numéro saisi librement → format E.164, avec le Cameroun par défaut. */
export function normalizePhone(value: string) {
  const digits = value.replace(/[^\d+]/g, "").replace(/^00/, "+");
  return digits.startsWith("+") ? digits : `+237${digits.replace(/^237(?=\d{9}$)/, "")}`;
}
