import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Section } from "@/components/legal/page-shell";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Güvenlik · Luca",
  description:
    "Hesap güvenliği, ödeme güvenliği ve veri koruma — Luca'da bilgilerini nasıl koruyoruz.",
};

export default function GuvenlikPage() {
  return (
    <PageShell
      eyebrow="Güvenlik"
      title="Güvenliğin bizim için öncelik."
      lead="Hesabını, ödemelerini ve kişisel verilerini korumak için sektör standardı önlemler alıyoruz. İşte nasıl."
    >
      <Section n="01" title="Hesap güvenliği">
        <p>
          Şifreler sunucularımızda asla düz metin tutulmaz; modern bir algoritmayla
          (argon2) özetlenerek saklanır. Oturumlar kısa ömürlü güvenli jetonlarla yönetilir
          ve şifreni değiştirdiğinde diğer oturumlar otomatik kapatılır.
        </p>
        <p>
          Hesabını güçlü ve sana özel bir şifreyle koru. Şüpheli bir durum fark edersen
          şifreni hemen{" "}
          <Link href="/sifremi-unuttum" className="text-primary hover:underline">
            sıfırla
          </Link>
          . İki adımlı doğrulama (2FA) yakında.
        </p>
      </Section>

      <Section n="02" title="Ödeme güvenliği">
        <p>
          Tüm trafik SSL/TLS ile şifrelenir. Kart bilgilerin Luca sunucularında saklanmaz;
          ödemeler lisanslı ödeme kuruluşu altyapısı ve 3D Secure üzerinden alınır. Yani
          kart verin bizimle değil, doğrudan bankanla/ödeme sağlayıcısıyla paylaşılır.
        </p>
      </Section>

      <Section n="03" title="Veri ve gizlilik">
        <p>
          Kişisel verilerini yalnızca hizmeti sunmak için, KVKK'ya uygun şekilde işleriz.
          Hangi verileri neden işlediğimizi ve haklarını{" "}
          <Link href="/kvkk" className="text-primary hover:underline">
            KVKK Aydınlatma Metni
          </Link>{" "}
          ile{" "}
          <Link href="/cerez" className="text-primary hover:underline">
            Çerez Politikası
          </Link>
          'nda bulabilirsin. İstediğin an hesabını ve verilerini silme hakkına sahipsin.
        </p>
      </Section>

      <Section n="04" title="Güvenlik açığı bildirimi">
        <p>
          Bir güvenlik açığı tespit ettiysen, kötüye kullanmadan bize bildir. Sorumlu
          bildirim yapan araştırmacılara teşekkür ederiz.
        </p>
        <p className="mt-2">
          <a href={`mailto:${COMPANY.kvkkEmail}`} className="text-primary hover:underline">
            {COMPANY.kvkkEmail}
          </a>
        </p>
      </Section>
    </PageShell>
  );
}
