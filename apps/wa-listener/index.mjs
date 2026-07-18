// Luca — WhatsApp grup dinleyici.
// Bir telefonu "bağlı cihaz" olarak eşler (QR), hedef grubun mesajlarını
// API webhook'una (POST /webhooks/whatsapp/inbound) iletir. Parse + admin
// onayı API tarafında yapılır. Session diskte saklanır; bir kez QR yeter.
//
// Env:
//   WA_API_URL         API kök URL (örn. http://localhost:3001/api/v1)
//   WA_WEBHOOK_SECRET  webhook shared secret (API ile aynı)
//   WA_GROUP_NAME      dinlenecek grubun tam adı. BOŞSA hiçbir şey iletmez,
//                      sadece gördüğü grup adlarını loglar (adı bulman için).
//   WA_SESSION_DIR     Baileys auth klasörü (varsayılan ./session)
//   WA_ALLOW_ALL       "1" ise TÜM gruplardan iletir (WA_GROUP_NAME'i yok sayar)

import Baileys, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from 'baileys';
const makeWASocket = Baileys.default ?? Baileys;
import qrcode from 'qrcode-terminal';
import QRCode from 'qrcode';
import { join } from 'node:path';
import pino from 'pino';

const API_URL = (process.env.WA_API_URL || 'http://localhost:3001/api/v1').replace(/\/$/, '');
const SECRET = process.env.WA_WEBHOOK_SECRET || '';
const GROUP_NAME = (process.env.WA_GROUP_NAME || '').trim();
const SESSION_DIR = process.env.WA_SESSION_DIR || './session';
const ALLOW_ALL = process.env.WA_ALLOW_ALL === '1';
// Uzaktaki telefon için: numara verilirse QR yerine 8 haneli eşleştirme kodu üretir.
// Uluslararası format, sembolsüz: örn. 905321234567
const PAIR_NUMBER = (process.env.WA_PAIR_NUMBER || '').replace(/[^0-9]/g, '');

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

// jid → grup adı (subject) önbelleği; her mesajda metadata çekmemek için.
const groupNameCache = new Map();
const seenGroups = new Set(); // WA_GROUP_NAME boşken adları bir kez loglamak için

async function groupSubject(sock, jid) {
  if (groupNameCache.has(jid)) return groupNameCache.get(jid);
  try {
    const meta = await sock.groupMetadata(jid);
    groupNameCache.set(jid, meta.subject);
    return meta.subject;
  } catch {
    return null;
  }
}

function extractText(msg) {
  const m = msg.message;
  if (!m) return '';
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    ''
  ).trim();
}

async function forward({ waMessageId, text, groupName, sender }) {
  try {
    const res = await fetch(`${API_URL}/webhooks/whatsapp/inbound`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-wa-secret': SECRET },
      body: JSON.stringify({ waMessageId, text, groupName, sender }),
    });
    if (!res.ok) {
      log.error(`webhook ${res.status}: ${await res.text()}`);
      return;
    }
    const data = await res.json();
    log.info(`→ iletildi (${data.status}${data.duplicate ? ', mükerrer' : ''}): ${text.slice(0, 60)}`);
  } catch (e) {
    log.error(`webhook hatası: ${e.message}`);
  }
}

async function main() {
  if (!SECRET) log.warn('WA_WEBHOOK_SECRET boş — API korumasız kabul etmiyorsa istekler reddedilir.');
  if (!GROUP_NAME && !ALLOW_ALL) {
    log.warn('WA_GROUP_NAME boş — hiçbir mesaj iletilmeyecek. Aşağıda gördüğüm grup adlarını .env\'e yaz.');
  }

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    markOnlineOnConnect: false,
  });

  sock.ev.on('creds.update', saveCreds);

  // Uzaktaki telefon: numara verildiyse QR yerine eşleştirme kodu iste.
  if (PAIR_NUMBER && !sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(PAIR_NUMBER);
        log.info('════════════════════════════════════════════');
        log.info(`  EŞLEŞTİRME KODU:  ${code}`);
        log.info('  Bu kodu telefon sahibine ilet. Telefonda:');
        log.info('  WhatsApp → Ayarlar → Bağlı Cihazlar → Cihaz Ekle');
        log.info('  → "Telefon numarasıyla bağla" → kodu gir.');
        log.info('════════════════════════════════════════════');
      } catch (e) {
        log.error(`eşleştirme kodu alınamadı: ${e.message}`);
      }
    }, 3000);
  }

  sock.ev.on('connection.update', (u) => {
    const { connection, lastDisconnect, qr } = u;
    if (qr && !PAIR_NUMBER) {
      const png = join(SESSION_DIR, '..', 'luca-wa-qr.png');
      qrcode.generate(qr, { small: true }); // terminalde ASCII
      QRCode.toFile(png, qr, { width: 512, margin: 2 })
        .then(() => log.info(`QR resmi kaydedildi → ${png}  (indir, Anıl'a yolla, 2. ekranda açıp telefonla taratsın)`))
        .catch((e) => log.warn(`QR resmi yazılamadı: ${e.message}`));
    }
    if (connection === 'open') log.info('✓ WhatsApp bağlandı. Grup mesajları dinleniyor…');
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const registered = sock.authState.creds.registered;
      if (!registered) {
        // Henüz eşleşmedi. 401 (loggedOut) = bozuk/ret session → temizle. Diğer (408 süre
        // aşımı vb.) → KAPANMA, otomatik yeni kod üretip beklemeye devam et (sınırsız şans).
        if (code === DisconnectReason.loggedOut) {
          log.warn('Eşleşme reddedildi / oturum bozuk. Temizle + tekrar: rm -rf ' + SESSION_DIR);
          process.exit(1);
        }
        log.warn(`Eşleşme bekleniyor (code ${code}) — ${PAIR_NUMBER ? 'YENİ KOD üretiliyor…' : 'QR yenileniyor…'}`);
        setTimeout(() => main().catch((e) => log.error(e)), 3000);
        return;
      }
      // Eşleşmiş: kalıcı çıkışsa dur, değilse yeniden bağlan.
      if (code === DisconnectReason.loggedOut) {
        log.warn('Çıkış yapıldı — yeniden eşleşme gerekli. rm -rf ' + SESSION_DIR);
        process.exit(1);
      }
      log.warn(`bağlantı kapandı (code ${code}). Yeniden bağlanılıyor…`);
      setTimeout(() => main().catch((e) => log.error(e)), 1500);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      const jid = msg.key?.remoteJid || '';
      if (!jid.endsWith('@g.us')) continue; // sadece gruplar
      if (msg.key.fromMe) continue;

      const subject = await groupSubject(sock, jid);

      // Hedef grup filtresi.
      if (!ALLOW_ALL) {
        if (!GROUP_NAME) {
          if (subject && !seenGroups.has(subject)) {
            seenGroups.add(subject);
            log.info(`(grup görüldü) "${subject}" — bunu dinlemek istiyorsan WA_GROUP_NAME'e yaz.`);
          }
          continue;
        }
        if (subject !== GROUP_NAME) continue;
      }

      const text = extractText(msg);
      if (!text) continue; // metinsiz (salt medya) mesajı v1'de atla

      await forward({
        waMessageId: msg.key.id,
        text,
        groupName: subject || undefined,
        sender: msg.pushName || msg.key.participant || undefined,
      });
    }
  });
}

main().catch((e) => {
  log.error(e);
  process.exit(1);
});
