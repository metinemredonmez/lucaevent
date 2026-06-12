import type { Metadata } from "next";
import { PageShell, Section } from "@/components/legal/page-shell";

export const metadata: Metadata = {
  title: "Çerez Politikası · Novara Network",
  description:
    "novaranetwork.com web sitesinde kullanılan çerezler ve tercihlerinizi nasıl yönetebileceğinize dair bilgiler.",
};

export default function CerezPage() {
  return (
    <PageShell
      eyebrow="Çerez"
      title="Çerez Politikası"
      lead="Siteyi daha hızlı, daha güvenli ve daha kişisel hale getirmek için az sayıda çerez kullanıyoruz. Bu sayfa hangi çerezleri ne için kullandığımızı ve nasıl yöneteceğinizi anlatır."
      updatedAt="22 Nisan 2026"
    >
      <Section n="01" title="Çerez nedir?">
        <p>
          Çerez (cookie), tarayıcınız tarafından cihazınızda depolanan küçük bir metin
          dosyasıdır. Siteler sizi tanımak, tercihlerinizi hatırlamak ve site kullanımını
          iyileştirmek için çerez kullanır.
        </p>
      </Section>

      <Section n="02" title="Kullandığımız çerez türleri">
        <div className="space-y-4">
          <div>
            <div className="text-foreground font-medium">Zorunlu çerezler</div>
            <p>
              Sitenin çalışması için gereklidir. Oturum, tema tercihi (koyu/açık), dil ve
              güvenlik amaçlı kullanılır. Bu çerezler devre dışı bırakılamaz.
            </p>
          </div>
          <div>
            <div className="text-foreground font-medium">Performans çerezleri</div>
            <p>
              Hangi sayfaların kaç kez açıldığını, hata oranlarını ve yükleme sürelerini
              toplar — anonim olarak. Kimliğinize bağlanmaz. Bu çerezleri istediğiniz zaman
              reddedebilirsiniz.
            </p>
          </div>
          <div>
            <div className="text-foreground font-medium">İşlevsellik çerezleri</div>
            <p>
              Katılım listeniz, kaydedilmiş aktiviteler ve tercihler gibi site deneyimini
              kişiselleştirir.
            </p>
          </div>
        </div>
      </Section>

      <Section n="03" title="Üçüncü taraf çerezler">
        <p>
          Sitenin bazı bölümlerinde üçüncü taraf gömülü içerikler kullanırız (Instagram/YouTube
          embed&apos;leri, harita, ödeme form&apos;u). Bu üçüncü taraflar kendi çerezlerini
          bırakabilir. Bu çerezler üzerinde kontrolümüz yoktur; ilgili şirketlerin gizlilik
          politikalarına tabidir.
        </p>
      </Section>

      <Section n="04" title="Çerez tercihlerinizi yönetme">
        <p>Çerezleri üç yolla yönetebilirsiniz:</p>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>
            Siteye ilk girişinizde görünen <strong className="text-foreground">çerez
            banneri</strong> üzerinden kategori bazında seçim yapabilirsiniz.
          </li>
          <li>
            <strong className="text-foreground">Tarayıcı ayarlarından</strong> tüm çerezleri
            engelleyebilir veya silebilirsiniz. (Zorunlu çerezler engellenirse site düzgün
            çalışmayabilir.)
          </li>
          <li>
            İstediğiniz zaman bu sayfanın sonundaki &ldquo;Tercihlerimi sıfırla&rdquo; bağlantısını
            kullanabilirsiniz.
          </li>
        </ul>
      </Section>

      <Section n="05" title="Saklama süresi">
        <p>
          Oturum çerezleri tarayıcıyı kapattığınızda silinir. Kalıcı çerezlerin süresi 30 gün ile
          13 ay arasındadır — amacına göre değişir. Süre dolduğunda çerez otomatik silinir.
        </p>
      </Section>

      <Section n="06" title="İletişim">
        <p>
          Çerez kullanımına dair sorularınızı{" "}
          <a className="text-primary hover:underline" href="mailto:kvkk@novaranetwork.com">
            kvkk@novaranetwork.com
          </a>{" "}
          adresine iletebilirsiniz. Daha kapsamlı bilgi için{" "}
          <a className="text-primary hover:underline" href="/kvkk">
            KVKK Aydınlatma Metni&apos;ne
          </a>{" "}
          göz atabilirsiniz.
        </p>
      </Section>
    </PageShell>
  );
}
