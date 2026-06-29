import type { Metadata } from "next";
import { PageShell, Section } from "@/components/legal/page-shell";
import { COMPANY_SELLER_LINE } from "@/lib/company";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi & Ön Bilgilendirme · Luca",
  description:
    "Luca üzerinden bilet satışına ilişkin mesafeli satış sözleşmesi, ön bilgilendirme, cayma hakkı ve iptal/iade koşulları.",
};

export default function MesafeliSatisPage() {
  return (
    <PageShell
      eyebrow="Satış"
      title="Mesafeli Satış Sözleşmesi & Ön Bilgilendirme"
      lead="6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, Luca üzerinden bilet alımına ilişkin koşullar. Bilet satın alarak bu sözleşmeyi kabul etmiş olursun."
      updatedAt="25 Haziran 2026"
    >
      <Section n="00" title="Önemli not">
        <p className="rounded-lg border border-border bg-secondary/40 p-4 text-sm">
          Bu metin bir <strong className="text-foreground">taslaktır</strong>; yürürlükten önce
          hukuk danışmanınca gözden geçirilmeli ve <code>[…]</code> alanları (ünvan, adres,
          MERSIS, vergi dairesi/no, iletişim) doldurulmalıdır.
        </p>
      </Section>

      <Section n="01" title="Taraflar">
        <p>
          <strong className="text-foreground">Satıcı:</strong> {COMPANY_SELLER_LINE}.
        </p>
        <p className="mt-2">
          <strong className="text-foreground">Alıcı (Tüketici):</strong> Sipariş sırasında
          belirttiğin ad, e-posta, telefon ve teslim/iletişim bilgilerine sahip kişi.
        </p>
      </Section>

      <Section n="02" title="Sözleşmenin konusu ve ürün/hizmet">
        <p>
          Sözleşmenin konusu, Alıcı'nın Luca üzerinden elektronik ortamda satın aldığı etkinlik
          biletinin (katılım hakkının) satışı ve ifasıdır. Etkinliğin adı, tarihi, yeri, bilet
          türü (ör. Standart, Erken Kuş, VIP, Çift), adedi, birim ve toplam bedeli ile varsa
          indirim kodu, sipariş özetinde ve onay e-postasında yer alır ve bu sözleşmenin ayrılmaz
          parçasıdır.
        </p>
      </Section>

      <Section n="03" title="Bedel, ödeme ve fatura">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Fiyatlar Türk Lirası (₺) cinsinden ve KDV dâhildir. Geçerli fiyat, ödeme anında sipariş özetinde gösterilen tutardır.</li>
          <li>Ödeme, lisanslı ödeme kuruluşu (Iyzico/PayTR) altyapısı üzerinden kredi/banka kartı ve 3D Secure ile alınır. Kart bilgileri Luca tarafından saklanmaz.</li>
          <li>Ödeme onaylanmadan bilet düzenlenmez; onaylanmayan/iptal olan siparişlerde ayrılan kontenjan serbest bırakılır.</li>
          <li>Talep edilmesi hâlinde e-fatura/e-arşiv düzenlenir.</li>
        </ul>
      </Section>

      <Section n="04" title="İfa ve teslim">
        <p>
          Bilet, ödeme onayının ardından elektronik QR belge olarak Alıcı'nın hesabına tanımlanır
          ve e-posta ile iletilir. Fiziki teslimat yoktur. Etkinlik girişinde QR kod okutularak
          giriş sağlanır; her QR tek girişliktir.
        </p>
      </Section>

      <Section n="05" title="Cayma hakkı">
        <p>
          Mesafeli Sözleşmeler Yönetmeliği <strong className="text-foreground">m.15/1-(g)</strong>{" "}
          uyarınca, <strong className="text-foreground">belirli bir tarihte veya dönemde yapılması
          gereken eğlence, etkinlik, konser, spor ve benzeri hizmetlere ilişkin sözleşmelerde
          tüketicinin cayma hakkı bulunmamaktadır.</strong> Luca biletleri belirli tarihli
          etkinliklere yönelik olduğundan, kural olarak cayma hakkı kapsamı dışındadır.
        </p>
        <p className="mt-3">
          Bununla birlikte Luca, aşağıdaki <em>iptal ve iade politikası</em> çerçevesinde iyi
          niyetli iade imkânı sunabilir.
        </p>
      </Section>

      <Section n="06" title="İptal ve iade politikası">
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Durum</th>
                <th className="text-left font-medium px-4 py-3">Sonuç</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["Etkinlik Luca tarafından iptal edilirse", "Bilet bedelinin tamamı, aynı ödeme yöntemine iade edilir."],
                ["Etkinlik ertelenirse", "Yeni tarih için bilet geçerli kalır; katılamayacaksan iade talep edebilirsin."],
                ["Alıcı talebiyle iptal — [etkinlikten 7+ gün önce]", "Bedel [iade edilir / hizmet bedeli düşülerek iade edilir] (politikaya göre doldurulacak)."],
                ["Alıcı talebiyle iptal — [son 7 gün]", "Kontenjan ve maliyet nedeniyle iade [yapılmayabilir]."],
                ["Kullanılmış (kapıda okutulmuş) bilet", "İade edilmez."],
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
          Onaylanan iadeler, ödeme kuruluşunun süreçlerine bağlı olarak{" "}
          <strong className="text-foreground">genellikle 14 gün içinde</strong> aynı karta yapılır.
          İade talepleri: <a className="text-primary hover:underline" href="mailto:destek@lucaclub.com.tr">destek@lucaclub.com.tr</a>.
        </p>
      </Section>

      <Section n="07" title="Mücbir sebep">
        <p>
          Doğal afet, salgın, resmi yasak, olağanüstü hava koşulu gibi tarafların kontrolü
          dışındaki hâllerde etkinlik ertelenebilir veya iptal edilebilir; bu durumda yukarıdaki
          iade hükümleri uygulanır ve Luca ek bir tazminatla yükümlü olmaz.
        </p>
      </Section>

      <Section n="08" title="Uyuşmazlık çözümü">
        <p>
          Şikâyetlerini önce <a className="text-primary hover:underline" href="mailto:destek@lucaclub.com.tr">destek@lucaclub.com.tr</a>{" "}
          üzerinden iletebilirsin. Uyuşmazlıklarda, Ticaret Bakanlığı'nca ilan edilen parasal
          sınırlar dâhilinde Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.
        </p>
      </Section>
    </PageShell>
  );
}
