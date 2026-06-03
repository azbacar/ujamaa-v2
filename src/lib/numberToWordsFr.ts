// Convertit un nombre en lettres (français)
const UNITS = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

function below1000(n: number): string {
  if (n === 0) return '';
  let res = '';
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (h > 0) {
    res += h === 1 ? 'cent' : UNITS[h] + ' cent';
    if (h > 1 && r === 0) res += 's';
    if (r > 0) res += ' ';
  }
  if (r > 0) {
    if (r < 20) {
      res += UNITS[r];
    } else {
      const t = Math.floor(r / 10);
      const u = r % 10;
      if (t === 7 || t === 9) {
        res += TENS[t] + (t === 7 && u === 1 ? ' et ' : '-') + UNITS[10 + u];
      } else {
        res += TENS[t];
        if (t === 8 && u === 0) res += 's';
        if (u > 0) res += (u === 1 && t !== 8 ? ' et ' : '-') + UNITS[u];
      }
    }
  }
  return res.trim();
}

export function numberToWordsFr(num: number): string {
  if (!isFinite(num)) return '';
  num = Math.floor(Math.abs(num));
  if (num === 0) return 'zéro';

  const parts: string[] = [];
  const billions = Math.floor(num / 1_000_000_000);
  const millions = Math.floor((num % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((num % 1_000_000) / 1000);
  const rest = num % 1000;

  if (billions > 0) parts.push((billions === 1 ? 'un' : below1000(billions)) + ' milliard' + (billions > 1 ? 's' : ''));
  if (millions > 0) parts.push((millions === 1 ? 'un' : below1000(millions)) + ' million' + (millions > 1 ? 's' : ''));
  if (thousands > 0) parts.push((thousands === 1 ? '' : below1000(thousands) + ' ') + 'mille');
  if (rest > 0) parts.push(below1000(rest));

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function amountInWordsFr(amount: number, currency = 'KMF'): string {
  const int = Math.floor(amount);
  const cents = Math.round((amount - int) * 100);
  const currencyName: Record<string, [string, string]> = {
    KMF: ['franc comorien', 'centime'],
    FC: ['franc comorien', 'centime'],
    EUR: ['euro', 'centime'],
    USD: ['dollar', 'cent'],
    XAF: ['franc CFA', 'centime'],
  };
  const [cName, sName] = currencyName[currency] || [currency.toLowerCase(), 'centime'];
  let res = numberToWordsFr(int) + ' ' + cName + (int > 1 ? 's' : '');
  if (cents > 0) {
    res += ' et ' + numberToWordsFr(cents) + ' ' + sName + (cents > 1 ? 's' : '');
  }
  return res.charAt(0).toUpperCase() + res.slice(1);
}
