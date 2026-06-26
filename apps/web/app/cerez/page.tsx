import type { Metadata } from "next";
import { PageShell, Section } from "@/components/legal/page-shell";

export const metadata: Metadata = {
  title: "Çerez Politikası · Luca",
  description:
    "lucaclub.com.tr'de kullanılan çerezler ve tercihlerinizi nasıl yönetebileceğinize dair bilgiler.",
};

export default function CerezPage() {
  return (
    <PageShell
      eyebrow="Çerez"
      title="Çerez Politikası"
      lead="Siteyi daha hızlı, güvenli ve kişisel hale getirmek için az sayıda çerez ve benzeri teknoloji kullanıyoruz. Bu sayfa hangi çerezleri ne için kullandığımızı ve nasıl yöneteceğinizi anlatır."
      updatedAt="25 Haziran 2026"
    >
      <Section n="01" title="Çerez nedir?">
        <p>
          Çerez (cookie), tarayıcınız tarafından cihazınızda saklanan küçük bir metin dosyasıdır.
          Siteler sizi tanımak, oturumunuzu sürdürmek ve kullanımı iyileştirmek için çerez ve
          yerel depolama (localStorage) gibi teknolojiler kullanır. Luca, giriş oturumunuzu
          cihazınızdaki güvenli depolamada tutar.
        </p>
      </Section>

      <Section n="02" title="Kullandığımız çerez türleri">
        <div className="space-y-4">
          <div>
            <div className="text-foreground font-medium">Zorunlu çerezler</div>
            <p>
              Oturum açma, hesap güvenliği, sepet/bilet işlemleri ve site güvenliği için
              gereklidir. Bunlar olmadan temel işlevler çalışmaz; kapatılamaz.
            </p>
          </div>
          <div>
            <div className="text-foreground font-medium">Tercih çerezleri</div>
            <p>Dil, tema ve görüntüleme tercihlerinizi hatırlar.</p>
          </div>
          <div>
            <div className="text-foreground font-medium">Analitik çerezler (varsa)</div>
            <p>
              Sayfa kullanımı hakkında toplu/anonim istatistik üretir; hizmeti iyileştirmemize
              yardımcı olur. Bunlar yalnızca açık rızanızla çalışır.
            </p>
          </div>
        </div>
      </Section>

      <Section n="03" title="Üçüncü taraf hizmetleri">
        <p>
          Ödeme (Iyzico/PayTR), bildirim (OneSignal) ve Google ile giriş gibi entegrasyonlar
          kendi çerez/teknolojilerini kullanabilir. Bu hizmetler kendi gizlilik ve çerez
          politikalarına tabidir.
        </p>
      </Section>

      <Section n="04" title="Çerezleri yönetme">
        <p>
          Tarayıcı ayarlarından çerezleri silebilir veya engelleyebilirsiniz; ancak zorunlu
          çerezleri engellerseniz giriş ve bilet işlemleri çalışmayabilir. Oturumunuzu sonlandırmak
          için <em>Çıkış</em> yapabilir veya cihazınızdaki site verilerini temizleyebilirsiniz.
        </p>
        <p className="mt-3">
          Sorularınız için:{" "}
          <a className="text-primary hover:underline" href="mailto:kvkk@lucaclub.com.tr">
            kvkk@lucaclub.com.tr
          </a>
        </p>
      </Section>
    </PageShell>
  );
}
