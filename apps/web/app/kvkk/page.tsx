import type { Metadata } from "next";
import { PageShell, Section } from "@/components/legal/page-shell";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni · Novara Network",
  description:
    "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Novara Network aydınlatma metni.",
};

export default function KvkkPage() {
  return (
    <PageShell
      eyebrow="Gizlilik"
      title="KVKK Aydınlatma Metni"
      lead="6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında hazırlanmıştır. Üyelerimizin ve site ziyaretçilerinin kişisel verilerini hangi amaçla, hangi hukuki sebebe dayanarak işlediğimizi ve haklarınızı burada şeffaf biçimde açıklıyoruz."
      updatedAt="22 Nisan 2026"
    >
      <Section n="01" title="Veri sorumlusu">
        <p>
          Bu aydınlatma metni, <strong className="text-foreground">Novara Network</strong>{" "}
          (&ldquo;Novara&rdquo; veya &ldquo;biz&rdquo;) tarafından işletilen{" "}
          <strong className="text-foreground">novaranetwork.com</strong> web sitesi, mobil
          uygulamalar ve topluluk iletişim kanalları (Instagram, YouTube, TikTok, WhatsApp
          grupları, bülten ve etkinlik kayıt formları) için geçerlidir. Novara, KVKK anlamında{" "}
          <em>veri sorumlusu</em> sıfatını taşır.
        </p>
        <p className="mt-3">
          <span className="text-foreground">İletişim:</span>{" "}
          <a className="text-primary hover:underline" href="mailto:kvkk@novaranetwork.com">
            kvkk@novaranetwork.com
          </a>
        </p>
      </Section>

      <Section n="02" title="İşlenen kişisel veri kategorileri">
        <p>KVKK kapsamında aşağıdaki veri kategorilerini, amaçla sınırlı biçimde işleriz:</p>
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Kategori</th>
                <th className="text-left font-medium px-4 py-3">İşlenen veriler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 text-foreground font-medium align-top">Kimlik</td>
                <td className="px-4 py-3 text-muted-foreground">Ad, soyad, doğum yılı (opsiyonel)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground font-medium align-top">İletişim</td>
                <td className="px-4 py-3 text-muted-foreground">E-posta adresi, telefon numarası, sosyal medya kullanıcı adı</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground font-medium align-top">Üyelik & katılım</td>
                <td className="px-4 py-3 text-muted-foreground">Üyelik durumu, katıldığın aktiviteler, RSVP, kontenjan listesi, iptal kayıtları</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground font-medium align-top">Görsel & işitsel</td>
                <td className="px-4 py-3 text-muted-foreground">Etkinliklerde çekilen, açıkça onayınla yayımlanan fotoğraf/video kayıtları</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground font-medium align-top">Finansal</td>
                <td className="px-4 py-3 text-muted-foreground">Ücretli etkinliklerde ödeme tutarı, fatura bilgileri (kart verileri bizde tutulmaz)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground font-medium align-top">İşlem güvenliği</td>
                <td className="px-4 py-3 text-muted-foreground">IP, oturum bilgisi, log kayıtları, kimlik doğrulama belirteçleri</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground font-medium align-top">Pazarlama</td>
                <td className="px-4 py-3 text-muted-foreground">Bülten tercih durumu, kampanya açılma/tıklama verileri (onay varsa)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground font-medium align-top">Teknik & çerez</td>
                <td className="px-4 py-3 text-muted-foreground">Cihaz türü, tarayıcı, dil, ziyaret edilen sayfalar, referans URL</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          Özel nitelikli kişisel verilerinizi (sağlık, ırk, din, cinsel hayat vb.) ilke olarak
          toplamayız. Erişilebilirlik ihtiyaçları gibi sebeplerle kendi isteğinle paylaştığın
          veriler, yalnız o amaç için ve açık rızanla işlenir.
        </p>
      </Section>

      <Section n="03" title="Kişisel veri işleme amaçları">
        <ul className="space-y-2 list-disc pl-5">
          <li>Topluluk üyeliğinin kurulması, yönetilmesi ve sonlandırılması</li>
          <li>Aktivite takviminin, duyuruların ve RSVP bilgisinin iletilmesi</li>
          <li>Aktivite sırasında kontenjan, kapıda check-in ve güvenlik yönetimi</li>
          <li>Ücretli etkinliklerde ödeme tahsilatı, fatura ve iade süreçlerinin yürütülmesi</li>
          <li>Müşteri memnuniyetinin ölçülmesi ve öneri/şikâyet süreçlerinin yönetimi</li>
          <li>Güvenlik, dolandırıcılık ve kötüye kullanım önleme</li>
          <li>Site/uygulama performansının anonimleştirilmiş analizle iyileştirilmesi</li>
          <li>Yasal yükümlülüklerimizin yerine getirilmesi ve resmi mercilere bildirim</li>
          <li>Açık rıza vermişsen bülten, anket ve kampanya iletişimlerinin yapılması</li>
        </ul>
      </Section>

      <Section n="04" title="İşlemenin hukuki sebepleri (KVKK m. 5 / m. 6)">
        <ul className="space-y-2 list-disc pl-5">
          <li>
            <span className="text-foreground">Sözleşmenin kurulması ve ifası</span> —
            üyelik ve etkinlik katılımının yönetimi için zorunlu veriler (m. 5/2-c)
          </li>
          <li>
            <span className="text-foreground">Hukuki yükümlülük</span> — vergi, muhasebe,
            elektronik ticaret ve tüketici mevzuatı kapsamında saklama (m. 5/2-ç)
          </li>
          <li>
            <span className="text-foreground">Meşru menfaat</span> — güvenlik, dolandırıcılık
            önleme ve hizmet iyileştirme (m. 5/2-f)
          </li>
          <li>
            <span className="text-foreground">Açık rıza</span> — bülten aboneliği,
            kişiselleştirilmiş pazarlama, etkinlik görsellerinin kampanyada kullanılması (m. 5/1)
          </li>
          <li>
            <span className="text-foreground">Temel hak ve özgürlük</span> — resmi talep
            halinde bilgi verme (m. 5/2-e)
          </li>
        </ul>
      </Section>

      <Section n="05" title="Veri toplama yöntemleri">
        <p>Kişisel verilerinizi aşağıdaki kanallar üzerinden topluyoruz:</p>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>Siteye üye olurken ve giriş yaparken doldurduğun formlar</li>
          <li>Etkinlik RSVP / bilet satın alma süreçleri</li>
          <li>İletişim formları, e-posta, telefon, Instagram DM, WhatsApp</li>
          <li>Çerezler ve benzer takip teknolojileri (ayrı politikamız vardır)</li>
          <li>Etkinlik alanında fotoğraf/video çekimi (rızaya dayalı)</li>
          <li>Ödeme işlemleri sırasında ödeme aracıları</li>
        </ul>
      </Section>

      <Section n="06" title="Aktarım ve üçüncü taraflar">
        <p>
          Verilerinizi yalnız işleme amacının gerektirdiği ölçüde, sözleşmesel gizlilik
          yükümlülüklerine tabi iş ortaklarımızla paylaşırız:
        </p>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>Barındırma, altyapı ve e-posta gönderim sağlayıcılarımız</li>
          <li>Ödeme kuruluşları (iyzico, Stripe vb.) — yalnız ücretli etkinliklerde</li>
          <li>Analitik ve ölçüm servisleri — anonimleştirilmiş biçimde</li>
          <li>Hukuki danışmanlarımız ve denetçiler — yükümlülüğümüz olduğunda</li>
          <li>Yetkili kamu kurum ve kuruluşları — yasal talep halinde</li>
        </ul>
        <p className="mt-3">
          <span className="text-foreground">Yurt dışına aktarım:</span> Sağlayıcılarımız
          gerektiğinde AB/ABD bulut bölgelerinde hizmet verebilir. Bu durumda KVKK&rsquo;nın
          9. maddesi uyarınca ya yeterliliğe sahip ülkeler tercih edilir ya da Kurum&rsquo;un
          öngördüğü taahhütnameler/Standart Sözleşme Hükümleri alınır.
        </p>
      </Section>

      <Section n="07" title="Saklama ve imha">
        <p>
          Her veri kategorisi için ayrı saklama süresi belirlenmiştir ve{" "}
          <em>Kişisel Veri Saklama ve İmha Politikası</em> dahilinde yönetilir. Özet olarak:
        </p>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>Üyelik verileri — üyelik sonrasında 30 gün içinde silinir/anonimleştirilir</li>
          <li>Etkinlik katılım verileri — aktiviteden 2 yıl sonra silinir</li>
          <li>Fatura/ödeme kayıtları — vergi mevzuatı gereği 10 yıl</li>
          <li>Log ve güvenlik kayıtları — 2 yıl</li>
          <li>İletişim talepleri — çözüm sonrası 1 yıl</li>
        </ul>
        <p className="mt-3">
          Süre dolduğunda silme, yok etme ya da anonimleştirme işlemi periyodik olarak ve
          talep üzerine uygulanır.
        </p>
      </Section>

      <Section n="08" title="Veri güvenliği tedbirleri">
        <p>
          Teknik ve idari tedbirlerle verilerinizin güvenliğini sağlarız:
        </p>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>Tüm trafikte TLS 1.2+ şifreleme ve güvenli oturum yönetimi</li>
          <li>Parolaların Argon2 algoritmasıyla tek yönlü hash&apos;lenmesi</li>
          <li>En az yetki prensibi, rol tabanlı erişim ve denetim günlükleri</li>
          <li>Düzenli yedekleme, felaket kurtarma testleri ve güvenlik yamaları</li>
          <li>Erişim sağlayan çalışanlara gizlilik taahhütnameleri</li>
          <li>Penetrasyon testi ve üçüncü taraf güvenlik denetimleri</li>
        </ul>
      </Section>

      <Section n="09" title="Çocukların gizliliği">
        <p>
          Hizmetlerimiz 18 yaş ve üzerindeki kullanıcılara yöneliktir. Bilerek 18 yaşın altından
          kişisel veri toplamayız. Böyle bir durumun farkına varırsak ilgili veriler ivedilikle
          silinir.
        </p>
      </Section>

      <Section n="10" title="İlgili kişi hakları (KVKK m. 11)">
        <p>Herkes, Novara&rsquo;ya başvurarak aşağıdaki haklarını kullanabilir:</p>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
          <li>İşlenmişse buna dair bilgi talep etme</li>
          <li>Amaç ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
          <li>Aktarıldığı üçüncü kişileri öğrenme</li>
          <li>Eksik/yanlış işlenmişse düzeltilmesini isteme</li>
          <li>Koşullar oluştuğunda silinmesini veya yok edilmesini isteme</li>
          <li>Düzeltme/silme işlemlerinin aktarıldığı taraflara bildirilmesini isteme</li>
          <li>Otomatik sistemlerle aleyhinize bir sonuca itiraz etme</li>
          <li>Kanuna aykırı işleme nedeniyle uğradığınız zararın giderilmesini talep etme</li>
        </ul>
      </Section>

      <Section n="11" title="Başvuru yöntemi">
        <p>
          Başvurularınızı{" "}
          <a className="text-primary hover:underline" href="mailto:kvkk@novaranetwork.com">
            kvkk@novaranetwork.com
          </a>{" "}
          adresine iletmen yeterli. Başvurunu en geç 30 gün içinde ücretsiz olarak yanıtlarız.
          Ayrıca Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ&rsquo;e uygun diğer
          yollarla da (noter, güvenli elektronik imza) başvurabilirsin.
        </p>
      </Section>

      <Section n="12" title="Değişiklikler">
        <p>
          Bu metin, mevzuat değişiklikleri ve hizmet kapsamındaki gelişmeler doğrultusunda
          güncellenebilir. Güncelleme tarihi sayfanın başındaki &ldquo;son güncelleme&rdquo;
          alanında görünür. Önemli değişiklikler, üyelere e-posta ve site duyurusu ile
          bildirilir.
        </p>
      </Section>
    </PageShell>
  );
}
