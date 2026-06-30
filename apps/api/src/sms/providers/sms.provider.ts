export interface SmsProvider {
  readonly name: string;
  send(to: string, message: string): Promise<void>;
}

/** Telefonu '90XXXXXXXXXX' (TR cep) biçimine getirir; geçersizse null. */
export function normalizePhone(input: string): string | null {
  let d = (input || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('90')) {
    // already country-coded
  } else if (d.startsWith('0')) {
    d = '90' + d.slice(1);
  } else if (d.length === 10 && d.startsWith('5')) {
    d = '90' + d;
  }
  return d.length === 12 && d.startsWith('905') ? d : null;
}
