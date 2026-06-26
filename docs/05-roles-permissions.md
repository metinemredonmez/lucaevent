# 05 — Roller & Yetkiler

`Role` enum (schema): **SUPERADMIN, ADMIN, EDITOR, DOOR, VIEWER**.

## Roller
| Rol | Kim | Özet |
|---|---|---|
| **SUPERADMIN** | Sistem sahibi | Her şey + kullanıcı/rol yönetimi + tehlikeli işlemler |
| **ADMIN** | Luca operasyon yöneticisi | Etkinlik/bilet/iade/mekân/ödeme, dashboard |
| **EDITOR** | İçerik ekibi | Etkinlik içeriği yaz/düzenle, ama **publish + iade yapamaz** |
| **DOOR** | Kapı/giriş personeli | Sadece QR check-in + katılımcı arama |
| **VIEWER** | Standart kullanıcı (default) | Public içerik + kendi bilet/sipariş/profili |

> Yeni kayıt olan herkes `VIEWER` (schema default). Admin rolleri elle atanır (SUPERADMIN tarafından).

## Yetki matrisi
| İşlem | SUPER | ADMIN | EDITOR | DOOR | VIEWER |
|---|:--:|:--:|:--:|:--:|:--:|
| Public içerik görüntüle | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bilet satın al / kendi profili | ✓ | ✓ | ✓ | ✓ | ✓ |
| Etkinlik oluştur/düzenle | ✓ | ✓ | ✓ | — | — |
| Etkinlik **publish/unpublish** | ✓ | ✓ | — | — | — |
| Bilet tier yönet | ✓ | ✓ | ✓ | — | — |
| Katılımcı listesi / CSV | ✓ | ✓ | ✓ | ✓¹ | — |
| QR **check-in** | ✓ | ✓ | — | ✓ | — |
| **İade** (refund) | ✓ | ✓ | — | — | — |
| Mekân / sanatçı yönet | ✓ | ✓ | ✓ | — | — |
| Dashboard / istatistik | ✓ | ✓ | — | — | — |
| Kullanıcı rolü değiştir | ✓ | —² | — | — | — |
| Etkinlik **sil** | ✓ | ✓³ | — | — | — |

¹ DOOR sadece o günkü/atandığı etkinliğin listesini görür.
² ADMIN kullanıcı rolü değiştiremez (yalnız SUPERADMIN) — yetki yükseltme riskine karşı.
³ ADMIN silebilir ama satışı olan etkinlik silinemez → `ARCHIVED` yapılır.

## Teknik uygulama (NestJS)
- `JwtAuthGuard` (global) + `@Public()` decorator istisna için.
- `RolesGuard` + `@Roles(Role.ADMIN, Role.EDITOR)` decorator.
- Sahiplik kontrolü: `/me/*` uçlarında `userId === token.sub`.
- Tüm yetki-gerektiren admin işlemleri `AuditLog`'a yazılır (actorId, action, entity).

```ts
@Roles(Role.ADMIN, Role.SUPERADMIN)
@Post(':id/publish')
publish(@Param('id') id: string) { ... }
```

## İlke
- **En az yetki:** her uç açıkça minimum rolü belirtir; default = reddet.
- **Yetki yükseltme yok:** rol atama tek elde (SUPERADMIN).
- **İz bırak:** para/yayın/silme işlemleri denetlenebilir.
