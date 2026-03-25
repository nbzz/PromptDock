import QRCode from 'qrcode';

/**
 * Generate a data URL (base64 PNG) QR code for a given URL.
 * Designed for mobile transfer: user scans QR → URL opens on phone.
 */
export async function generateQRCodeDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 240,
    margin: 2,
    color: {
      dark: '#1e293b',
      light: '#f8fafc'
    }
  });
}
