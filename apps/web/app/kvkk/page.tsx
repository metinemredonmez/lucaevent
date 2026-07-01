import type { Metadata } from "next";
import { PageShell, Section } from "@/components/legal/page-shell";
import { Markdown } from "@/components/markdown";
import { getPage } from "@/lib/content";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni · Luca",
  description:
    "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Luca aydınlatma metni — hangi verileri, hangi amaçla ve hukuki sebeple işliyoruz.",
};

export default async function KvkkPage() {
  const page = await getPage("kvkk");

  if (page) {
    return (
      <PageShell eyebrow="KVKK" title={page.title} lead={page.excerpt ?? undefined}>
        <Markdown content={page.content} />
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Gizlilik"
      title="KVKK Aydınlatma Metni"
      lead="6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında hazırlanmıştır. Üye, bilet alıcısı ve ziyaretçilerin kişisel verilerini hangi amaçla, hangi hukuki sebebe dayanarak işlediğimizi ve haklarınızı şeffaf biçimde açıklıyoruz."
      updatedAt="25 Haziran 2026"
    >
      <Section n="00" title="Önemli not">
        <p className="rounded-lg border border-border bg-secondary/40 p-4 text-sm">
          Bu metin bir <strong className="text-foreground">taslaktır</strong> ve yürürlüğe
          girmeden önce hukuk danışmanı tarafından gözden geçirilmeli; köşeli parantezli alanlar
          (<code>[…]</code>) şirketin gerçek bilgileriyle doldurulmalıdır.
        </p>
      </Section>

      <Section n="01" title="Veri sorumlusu">
        <p>
          Bu aydınlatma metni, <strong className="text-foreground">[Luca Club — Tam Şirket
          Ünvanı]</strong> (&ldquo;Luca&rdquo; veya &ldquo;biz&rdquo;) tarafından işletilen{" "}
          <strong className="text-foreground">lucaclub.com.tr</strong> web sitesi, mobil
          uygulama ve iletişim kanalları (e-posta, push bildirimleri, WhatsApp toplulukları,
          bülten ve etkinlik kayıt formları) için geçerlidir. Luca, KVKK anlamında{" "}
          <em>veri sorumlusu</em> sıfatını taşır.
        </p>
        <p className="mt-3">
          <span className="text-foreground">Adres:</span> [Açık adres / MERSIS no] ·{" "}
          <span className="text-foreground">İletişim:</span>{" "}
          <a className="text-primary hover:underline" href="mailto:kvkk@lucaclub.com.tr">
            kvkk@lucaclub.com.tr
          </a>
        </p>
      </Section>

      <Section n="02" title="İşlenen kişisel veri kategorileri">
        <p>Hizmetin gerektirdiği ölçüde ve amaçla sınırlı olarak şu verileri işleriz:</p>
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Kategori</th>
                <th className="text-left font-medium px-4 py-3">İşlenen veriler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["Kimlik", "Ad, soyad, doğum tarihi (opsiyonel)"],
                ["İletişim", "E-posta adresi, telefon numarası, şehir"],
                ["Hesap & güvenlik", "Şifre özeti (hash), Google ile giriş kimliği, oturum/yenileme token kayıtları, IP adresi ve tarayıcı bilgisi, hesap durumu"],
                ["İlgi & tercihler", "Seçtiğin ilgi alanları (yoga, kamp, workshop vb.), favoriler, bülten/pazarlama izni"],
                ["İşlem & bilet", "Sipariş kayıtları, bilet türü/adedi, tutar, ödeme sağlayıcı referansı, QR bilet kodu, kapı giriş (check-in) kaydı"],
                ["Rezervasyon", "Masa/alan rezervasyonu için ad, telefon, kişi sayısı, tarih"],
                ["Etkileşim", "Etkinlik sonrası puan/yorum, bekleme listesi kayıtları, bildirim tercihleri"],
                ["Hukuki", "KVKK açık rıza ve kullanım koşulları onay zaman damgaları, onay versiyonu"],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td className="px-4 py-3 text-foreground font-medium align-top">{k}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm">
          <strong className="text-foreground">Kredi kartı bilgileri Luca tarafından
          saklanmaz;</strong> ödeme, lisanslı ödeme kuruluşu (ör. Iyzico/PayTR) üzerinden
          işlenir ve kart verisi doğrudan ilgili kuruluşta tutulur.
        </p>
      </Section>

      <Section n="03" title="İşleme amaçları">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Üyelik oluşturma, kimlik doğrulama ve hesap güvenliği</li>
          <li>Bilet satışı, rezervasyon, QR ile etkinlik girişi ve kontenjan yönetimi</li>
          <li>Ödeme alınması, fatura/işlem kayıtlarının tutulması ve iade süreçleri</li>
          <li>Bilet onayı, etkinlik hatırlatması, değişiklik/iptal bildirimleri</li>
          <li>Talep ve şikâyetlerin yönetimi, destek sağlanması</li>
          <li>Hizmetin iyileştirilmesi, kişiselleştirme ve (açık rıza ile) pazarlama iletişimi</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi ve hukuki taleplere karşı savunma</li>
        </ul>
      </Section>

      <Section n="04" title="Hukuki sebepler (KVKK m.5)">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong className="text-foreground">Sözleşmenin kurulması/ifası (m.5/2-c):</strong> üyelik, bilet ve rezervasyon işlemleri.</li>
          <li><strong className="text-foreground">Hukuki yükümlülük (m.5/2-ç):</strong> vergi, ticaret ve tüketici mevzuatı kayıtları.</li>
          <li><strong className="text-foreground">Meşru menfaat (m.5/2-f):</strong> güvenlik, dolandırıcılık önleme, hizmet iyileştirme.</li>
          <li><strong className="text-foreground">Açık rıza (m.5/1):</strong> pazarlama/ticari elektronik ileti ve opsiyonel veriler.</li>
        </ul>
      </Section>

      <Section n="05" title="Aktarım & yurt dışı aktarım">
        <p>Verileriniz, hizmetin sağlanması için yalnızca gerekli olduğu ölçüde paylaşılır:</p>
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Alıcı</th>
                <th className="text-left font-medium px-4 py-3">Amaç</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["Ödeme kuruluşu (Iyzico/PayTR)", "Ödeme alma ve iade"],
                ["E-posta sağlayıcısı", "Doğrulama, bilet ve hatırlatma e-postaları"],
                ["Push sağlayıcısı (OneSignal)", "Mobil/tarayıcı bildirimleri"],
                ["Kimlik sağlayıcısı (Google)", "Google ile giriş (talep edersen)"],
                ["Bulut/depolama sağlayıcısı", "Görsel ve içerik barındırma"],
                ["Yetkili kurumlar", "Yasal talep hâlinde"],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td className="px-4 py-3 text-foreground font-medium align-top">{k}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm">
          Bazı sağlayıcılar yurt dışında sunucu kullanabilir; bu durumda aktarım KVKK m.9
          çerçevesinde, gerekli güvenceler veya açık rıza ile yapılır.
        </p>
      </Section>

      <Section n="06" title="Saklama süreleri">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Üyelik verileri: hesap aktif olduğu sürece; silme talebinde anonimleştirme.</li>
          <li>Sipariş, ödeme ve fatura kayıtları: ilgili mevzuat gereği <strong className="text-foreground">10 yıla kadar</strong>.</li>
          <li>Pazarlama izni kayıtları: izin geri alınana kadar + mevzuat süresi.</li>
          <li>Güvenlik/log kayıtları: makul güvenlik süresi boyunca.</li>
        </ul>
      </Section>

      <Section n="07" title="Haklarınız (KVKK m.11)">
        <p>
          İlgili kişi olarak; verinizin işlenip işlenmediğini öğrenme, bilgi talep etme,
          amacına uygun kullanılıp kullanılmadığını öğrenme, düzeltme, silme/yok edilme,
          aktarıldığı üçüncü kişilere bildirilmesini isteme, otomatik analize itiraz ve zararın
          giderilmesini talep etme haklarına sahipsiniz.
        </p>
        <p className="mt-3">
          Başvurularınızı{" "}
          <a className="text-primary hover:underline" href="mailto:kvkk@lucaclub.com.tr">
            kvkk@lucaclub.com.tr
          </a>{" "}
          adresine iletebilirsiniz; talebiniz en geç <strong className="text-foreground">30
          gün</strong> içinde sonuçlandırılır. Hesabını <em>Profil → Hesabımı sil</em> ile de
          anonimleştirebilirsin.
        </p>
      </Section>
    </PageShell>
  );
}
