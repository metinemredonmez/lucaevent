import type { Metadata } from "next";
import { PageShell, Section } from "@/components/legal/page-shell";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Kullanım Koşulları · Luca",
  description:
    "Luca platformunun üyelik, bilet, rezervasyon ve içerik kurallarını düzenleyen kullanım koşulları.",
};

export default function KosullarPage() {
  return (
    <PageShell
      eyebrow="Sözleşme"
      title="Kullanım Koşulları"
      lead="Luca'yı kullanarak bu koşulları kabul etmiş olursun. Üyelik, bilet alımı, rezervasyon ve içerik paylaşımına ilişkin hak ve yükümlülükler burada düzenlenir."
      updatedAt="25 Haziran 2026"
    >
      <Section n="00" title="Önemli not">
        <p className="rounded-lg border border-border bg-secondary/40 p-4 text-sm">
          Bu metin bir <strong className="text-foreground">taslaktır</strong>; yürürlükten önce
          hukuk danışmanınca gözden geçirilmeli, <code>[…]</code> alanları doldurulmalıdır.
        </p>
      </Section>

      <Section n="01" title="Taraflar ve tanımlar">
        <p>
          Bu koşullar, <strong className="text-foreground">{COMPANY.legalName}</strong>{" "}
          (&ldquo;Luca&rdquo;) ile platformu kullanan gerçek kişi (&ldquo;Kullanıcı&rdquo;)
          arasındadır. <em>Platform</em>: lucaclub.com.tr ve Luca mobil uygulaması.{" "}
          <em>Etkinlik</em>: wellness, outdoor &amp; spor, gezi, workshop, sosyal, yeme-içme,
          networking ve gece etkinlikleri dâhil Luca'da yayımlanan deneyimler. <em>Bilet</em>:
          bir etkinliğe katılım hakkı veren elektronik QR belge.
        </p>
      </Section>

      <Section n="02" title="Üyelik">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Üyelik için doğru ve güncel bilgi vermeyi kabul edersin. Hesap güvenliğinden sen sorumlusun.</li>
          <li>Kayıt sırasında KVKK aydınlatma metni ve bu koşullar onaylanır; onay olmadan üyelik tamamlanmaz.</li>
          <li>18 yaş sınırı bulunan etkinliklere yalnızca 18 yaşını doldurmuş kullanıcılar katılabilir; kapıda kimlik istenebilir.</li>
          <li>Bir kişi tek hesap açabilir; hesabın başkasına devri Luca onayına bağlıdır.</li>
        </ul>
      </Section>

      <Section n="03" title="Bilet ve rezervasyon">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Bilet alımı, ilgili etkinliğin <strong className="text-foreground">Mesafeli Satış Sözleşmesi</strong> hükümlerine tabidir.</li>
          <li>Her bilet tek girişlik bir QR kod içerir; kapıda okutulduğunda kullanılmış sayılır. QR kodunu paylaşma — ilk okutan içeri girer.</li>
          <li>Kontenjan sınırlıdır; tükenen kategoriler için bekleme listesine girilebilir, yer açıldığında bildirim gönderilir.</li>
          <li>Masa/alan rezervasyonları talep niteliğindedir ve Luca onayıyla kesinleşir.</li>
          <li>İptal ve iade koşulları <a className="text-primary hover:underline" href="/mesafeli-satis">Mesafeli Satış Sözleşmesi</a>'nde düzenlenir.</li>
        </ul>
      </Section>

      <Section n="04" title="Kullanıcı yükümlülükleri">
        <p>Platformu kullanırken aşağıdakileri yapmamayı kabul edersin:</p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>Yanıltıcı, sahte veya başkasına ait bilgilerle işlem yapmak; bilet/QR kodunu çoğaltmak veya yetkisiz satmak (karaborsa).</li>
          <li>Platformun güvenliğini tehdit etmek, otomatik/bot erişimi, aşırı istek veya sistemleri kötüye kullanmak.</li>
          <li>Hakaret, taciz, ayrımcılık, yasa dışı içerik paylaşmak; başkalarının haklarını ihlal etmek.</li>
          <li>Etkinliklerde Luca veya mekân kurallarına aykırı davranmak.</li>
        </ul>
      </Section>

      <Section n="05" title="Yorum ve kullanıcı içeriği">
        <p>
          Katıldığın etkinlikler için puan ve yorum bırakabilirsin. Paylaştığın içeriğin
          doğru, kendi hakkın olan ve hukuka uygun olduğunu beyan edersin. Luca, kurallara aykırı
          içeriği kaldırma hakkını saklı tutar. İçeriği paylaşarak, Luca'ya bu içeriği platformda
          gösterme ve tanıtım amacıyla kullanma yönünde basit kullanım hakkı verirsin.
        </p>
      </Section>

      <Section n="06" title="Fikri mülkiyet">
        <p>
          Luca markası, logosu, tasarımı, yazılımı ve içeriği Luca'ya veya lisans verenlerine
          aittir; izinsiz kopyalanamaz, çoğaltılamaz veya ticari amaçla kullanılamaz.
        </p>
      </Section>

      <Section n="07" title="Sorumluluğun sınırı">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Luca, etkinlikleri özenle düzenler; ancak hava koşulu, mücbir sebep veya zorunlu hâllerde program değişebilir/iptal edilebilir. Bu durumda iade koşulları uygulanır.</li>
          <li>Platform &ldquo;olduğu gibi&rdquo; sunulur; kesintisizlik veya hatasızlık garanti edilmez.</li>
          <li>Üçüncü taraf hizmetlerinden (ödeme, harita, bildirim) kaynaklanan aksaklıklardan Luca, kendi kusuru dışında sorumlu tutulamaz.</li>
        </ul>
      </Section>

      <Section n="08" title="Hesabın askıya alınması">
        <p>
          Bu koşulların ihlali, sahtecilik veya güvenlik riski hâlinde Luca, hesabı geçici veya
          kalıcı olarak askıya alabilir. Kullanıcı, <em>Profil → Hesabımı sil</em> ile dilediği
          zaman üyeliğini sonlandırabilir; bu durumda kişisel verileri anonimleştirilir, yasal
          saklama yükümlülüğü olan işlem kayıtları mevzuat süresince saklanır.
        </p>
      </Section>

      <Section n="09" title="Değişiklikler ve uygulanacak hukuk">
        <p>
          Luca bu koşulları güncelleyebilir; önemli değişiklikler uygun kanaldan duyurulur ve
          güncel sürüm yayım tarihinde yürürlüğe girer. Bu koşullara <strong className="text-foreground">
          Türkiye Cumhuriyeti hukuku</strong> uygulanır; uyuşmazlıklarda Tüketici Hakem Heyetleri
          ve {COMPANY.city} Mahkemeleri/İcra Daireleri yetkilidir.
        </p>
        <p className="mt-3">
          İletişim:{" "}
          <a className="text-primary hover:underline" href="mailto:destek@lucaclub.com.tr">
            destek@lucaclub.com.tr
          </a>
        </p>
      </Section>
    </PageShell>
  );
}
