# Configuración de Resend para emails de producción

## Estado actual

El flujo de recuperación de contraseña está **funcionalmente completo** en el código. Sin embargo, **Resend en plan gratuito solo permite enviar emails al correo verificado** (el email del owner del proyecto en Resend).

Esto significa:
- ✅ El flujo técnico funciona: `/forgot-password` → email → `/reset-password`
- ✅ La detección de URL (producción/local) es automática
- ⚠️ Los emails solo llegan al correo verificado en Resend
- ⚠️ Otros participantes NO recibirán el correo de recuperación

## Workaround temporal

Si un participante real necesita recuperar su contraseña:

1. Ve a **Supabase Dashboard** → **Authentication** → **Users**
2. Busca el usuario por email
3. Click en el menú ⋮ → **Send password recovery email**
4. Supabase enviará el email directamente (bypass Resend)

## Solución permanente: Verificar dominio propio

Para que **todos los participantes** puedan recibir emails de recuperación, necesitas:

### 1. Tener un dominio propio

Compra un dominio (ej. `quiniela2026.com`) en:
- Namecheap
- GoDaddy
- Google Domains
- Cloudflare

Costo aproximado: **$10-15 USD/año**

### 2. Verificar el dominio en Resend

1. Ve a [resend.com](https://resend.com) → **Domains** → **Add Domain**
2. Ingresa tu dominio: `quiniela2026.com`
3. Resend te dará registros DNS para configurar:
   - **SPF** (TXT record)
   - **DKIM** (TXT record)
   - **DMARC** (TXT record)

### 3. Configurar DNS

En el panel de tu proveedor de dominio (Namecheap, GoDaddy, etc.):

1. Ve a **DNS Management** o **DNS Settings**
2. Agrega los 3 registros TXT que Resend te indicó
3. Espera 10-30 minutos a que se propaguen
4. Vuelve a Resend y haz click en **Verify Domain**

### 4. Actualizar configuración de Supabase

1. Ve a **Supabase Dashboard** → **Settings** → **Auth** → **Email Templates**
2. En **SMTP Settings**, verifica que esté configurado Resend
3. En **Email Templates** → **Reset Password**, asegúrate de que la URL use tu dominio:
   ```
   {{ .SiteURL }}/auth/callback?code={{ .Token }}&next=/reset-password
   ```

### 5. Variables de entorno en Vercel

Opcional, si quieres forzar un dominio específico:

```bash
NEXT_PUBLIC_SITE_URL=https://quiniela2026.com
```

De lo contrario, el código ya usa `window.location.origin` automáticamente.

## Testing

Una vez configurado el dominio:

1. Cierra sesión en tu app
2. Ve a **Olvidé mi contraseña**
3. Ingresa el email de un participante de prueba
4. Verifica que el email llegue correctamente
5. Haz click en el enlace y confirma que redirige a `/reset-password`
6. Cambia la contraseña y confirma que funciona el login

## Costos

| Servicio | Plan | Costo |
|----------|------|-------|
| Dominio  | Anual | $10-15 USD/año |
| Resend   | Free | $0 (hasta 3,000 emails/mes) |
| Supabase | Free | $0 |
| Vercel   | Hobby | $0 |

**Total: ~$12 USD/año** para que el sistema funcione completamente.

## Alternativas sin dominio propio

Si no quieres comprar un dominio:

1. **Usar subdominio de Vercel**: `quiniela-mundial-2026.vercel.app`
   - Gratis
   - Menos profesional
   - Puede que Resend no permita verificarlo

2. **Usar servicio de email alternativo**:
   - SendGrid (plan free: 100 emails/día)
   - Mailgun (plan free: 5,000 emails/mes primeros 3 meses)
   - Requiere reconfigurar Supabase SMTP

3. **Workaround manual**:
   - Seguir usando el método del admin en Supabase Dashboard
   - Funcional pero tedioso si hay muchos usuarios

## Recomendación

Si tienes **5+ participantes activos**, vale la pena invertir los $12/año en un dominio propio. El flujo automático ahorra tiempo y mejora la experiencia de usuario.

Si son **menos de 5 participantes**, el workaround manual es suficiente.
