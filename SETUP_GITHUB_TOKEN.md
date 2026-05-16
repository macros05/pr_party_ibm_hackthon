# 🔑 Configuración de GitHub Token para Repositorios Privados

**Fecha:** 2026-05-16  
**Propósito:** Permitir análisis de Pull Requests en repositorios privados

---

## 📋 Pasos para Crear el Token

### 1. Accede a GitHub Settings
Abre en tu navegador:
```
https://github.com/settings/tokens
```

O navega manualmente:
1. Click en tu avatar (esquina superior derecha)
2. Settings
3. Developer settings (menú izquierdo, al final)
4. Personal access tokens → Tokens (classic)

### 2. Genera un Nuevo Token
1. Click en **"Generate new token"** → **"Generate new token (classic)"**
2. Dale un nombre descriptivo:
   ```
   PR Party - Análisis de PRs
   ```
3. Selecciona la expiración:
   - Para el hackathon: **7 days** o **30 days**
   - Para uso permanente: **No expiration** (menos seguro)

### 3. Selecciona los Permisos (Scopes)
**IMPORTANTE:** Solo necesitas marcar:
- ✅ **`repo`** (Full control of private repositories)
  - Esto incluye automáticamente:
    - repo:status
    - repo_deployment
    - public_repo
    - repo:invite
    - security_events

**NO necesitas marcar nada más** para este proyecto.

### 4. Genera y Copia el Token
1. Scroll hasta abajo
2. Click **"Generate token"**
3. **¡IMPORTANTE!** Copia el token INMEDIATAMENTE
   - Formato: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Solo se muestra UNA VEZ
   - Si lo pierdes, tendrás que crear uno nuevo

---

## 🔧 Configuración en el Proyecto

### Paso 1: Edita el archivo `.env`
Abre el archivo `backend/.env` y reemplaza la línea 7:

**ANTES:**
```env
GITHUB_TOKEN=your_github_token_here
```

**DESPUÉS:**
```env
GITHUB_TOKEN=ghp_tu_token_copiado_aqui
```

**Ejemplo:**
```env
GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuvwxyz
```

### Paso 2: Guarda el archivo
- Presiona `Ctrl+S` para guardar
- Verifica que el token esté correctamente pegado (sin espacios extra)

---

## 🚀 Reinicia el Backend

**IMPORTANTE:** Debes reiniciar el servidor para que cargue el nuevo token.

### En la terminal del backend:
1. Presiona `Ctrl+C` para detener el servidor
2. Ejecuta de nuevo:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

Deberías ver:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using WatchFiles
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## ✅ Verifica que Funciona

### Opción 1: Desde el Frontend
1. Abre `http://localhost:3000`
2. En el formulario "Analyze GitHub PR", ingresa:
   ```
   https://github.com/OscarM0ntero/Proyecto_Final_de_Grado_MH_Torremolinos/pull/3
   ```
3. Click "Analyze PR"
4. Deberías ver el análisis iniciarse sin errores

### Opción 2: Test con cURL
```bash
curl -X POST http://localhost:8000/analyze/sync \
  -H "Content-Type: application/json" \
  -d '{
    "github_url": "https://github.com/OscarM0ntero/Proyecto_Final_de_Grado_MH_Torremolinos/pull/3"
  }'
```

**Respuesta esperada:** JSON con findings (puede tardar 10-30 segundos)

**Error esperado si el token es inválido:**
```json
{
  "detail": "Failed to fetch PR from GitHub: 401 Client Error: Unauthorized"
}
```

---

## 🔒 Seguridad

### ✅ Buenas Prácticas
- ✅ El archivo `.env` está en `.gitignore` (no se subirá a GitHub)
- ✅ Nunca compartas tu token públicamente
- ✅ Revoca tokens que no uses en: https://github.com/settings/tokens

### ⚠️ Si Expones el Token Accidentalmente
1. Ve a https://github.com/settings/tokens
2. Click en el token expuesto
3. Click "Delete" o "Regenerate"
4. Crea uno nuevo siguiendo estos pasos

---

## 🐛 Troubleshooting

### Error: "401 Unauthorized"
**Causa:** Token inválido o expirado  
**Solución:**
1. Verifica que copiaste el token completo
2. Verifica que no haya espacios antes/después
3. Genera un nuevo token si expiró

### Error: "403 Forbidden"
**Causa:** Token sin permisos suficientes  
**Solución:**
1. Verifica que marcaste el scope `repo`
2. Genera un nuevo token con los permisos correctos

### Error: "404 Not Found"
**Causa:** El PR no existe o el token no tiene acceso  
**Solución:**
1. Verifica la URL del PR
2. Verifica que tu token tenga acceso al repositorio
3. Si es un repo de otra organización, necesitas permisos de esa org

### Backend sigue mostrando error 501
**Causa:** El servidor no se reinició  
**Solución:**
1. Detén el servidor con `Ctrl+C`
2. Reinicia con `uvicorn app.main:app --reload`
3. Verifica que veas "Application startup complete"

---

## 📊 Límites de Rate

Con token configurado:
- ✅ **5,000 requests por hora**
- ✅ Acceso a repositorios privados
- ✅ Sin restricciones de IP

Sin token:
- ⚠️ 60 requests por hora
- ⚠️ Solo repositorios públicos
- ⚠️ Por IP (compartido con otros servicios)

---

## ✅ Checklist Final

- [ ] Token creado en GitHub con scope `repo`
- [ ] Token copiado correctamente
- [ ] Archivo `backend/.env` actualizado (línea 7)
- [ ] Backend reiniciado (`Ctrl+C` y `uvicorn app.main:app --reload`)
- [ ] Test realizado con tu PR privado
- [ ] Análisis funciona correctamente

---

**¿Necesitas ayuda?** Revisa los logs del backend para ver errores específicos.

**Logs útiles:**
```bash
# En la terminal del backend, busca líneas como:
{"event": "github_fetch_error", "error": "..."}
{"event": "fetching_pr_from_github", "owner": "...", "repo": "...", "pr_number": ...}
```
