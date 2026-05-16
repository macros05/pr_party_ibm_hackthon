# 🔄 Guía Rápida de Reinicio - GitHub API

**Problema:** Backend muestra error 501 "GitHub API integration not yet implemented"  
**Causa:** El servidor no detectó los nuevos archivos creados  
**Solución:** Reiniciar manualmente el backend

---

## ⚡ Solución Rápida (30 segundos)

### Paso 1: Detén el Backend
En la terminal donde está corriendo el backend:
```
Presiona: Ctrl+C
```

Deberías ver algo como:
```
INFO:     Shutting down
INFO:     Waiting for application shutdown.
INFO:     Application shutdown complete.
INFO:     Finished server process [xxxxx]
```

### Paso 2: Reinicia el Backend
En la misma terminal:
```bash
cd backend
uvicorn app.main:app --reload
```

Deberías ver:
```
INFO:     Will watch for changes in these directories: ['C:\\Users\\oscar\\...\\backend']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using WatchFiles
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
{"event": "application_startup", ...}
INFO:     Application startup complete.
```

### Paso 3: Prueba tu PR
1. Abre http://localhost:3000
2. Ingresa tu URL:
   ```
   https://github.com/OscarM0ntero/Proyecto_Final_de_Grado_MH_Torremolinos/pull/3
   ```
3. Click "Analyze PR"
4. ¡Debería funcionar! 🎉

---

## 🔍 Verificación

Si funciona correctamente, en los logs del backend verás:
```
{"event": "fetching_pr_from_github", "owner": "OscarM0ntero", "repo": "Proyecto_Final_de_Grado_MH_Torremolinos", "pr_number": 3}
{"event": "pr_metadata_fetched", "title": "...", "author": "..."}
{"event": "diff_fetched", "size_bytes": ...}
```

---

## 🐛 Si Sigue Sin Funcionar

### Error 404 (Not Found)
**Causa:** El PR no existe o la URL es incorrecta  
**Solución:** Verifica que el PR #3 existe en tu repo

### Error 403 (Forbidden)
**Causa:** Rate limit excedido (60 requests/hora sin token)  
**Solución:** Espera 1 hora o configura GITHUB_TOKEN (ver SETUP_GITHUB_TOKEN.md)

### Sigue mostrando error 501
**Causa:** El backend no se reinició correctamente  
**Solución:**
1. Verifica que detuviste el proceso anterior (Ctrl+C)
2. Verifica que estás en el directorio `backend`
3. Ejecuta: `uvicorn app.main:app --reload`

---

## ✅ Checklist

- [ ] Backend detenido con Ctrl+C
- [ ] Backend reiniciado con `uvicorn app.main:app --reload`
- [ ] Mensaje "Application startup complete" visible
- [ ] Frontend en http://localhost:3000 funcionando
- [ ] URL del PR ingresada correctamente
- [ ] Análisis iniciado sin errores

---

**Tiempo total:** 30 segundos ⏱️
