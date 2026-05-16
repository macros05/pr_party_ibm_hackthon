# Granite (watsonx.ai) Setup Guide

Este documento explica cómo configurar IBM watsonx.ai Granite para PR Party.

## ✅ Ventajas de Usar Solo Granite

- **Setup simple**: Solo necesitas credenciales de watsonx.ai
- **No requiere Node.js 22+**: Funciona con cualquier versión
- **Potente**: Granite 3.3 es muy capaz para análisis de código
- **Mismo flujo**: Mantiene el patrón Mythos de 2 pasadas
- **Más barato**: Un solo servicio en lugar de dos

## 🔑 Obtener Credenciales de watsonx.ai

### 1. Acceder a IBM Cloud

1. Ve a https://cloud.ibm.com
2. Inicia sesión con tu cuenta IBM
3. Busca "watsonx.ai" en el catálogo

### 2. Crear Proyecto watsonx.ai

1. En watsonx.ai, crea un nuevo proyecto
2. Copia el **Project ID** (lo necesitarás)

### 3. Obtener API Key

1. Ve a https://cloud.ibm.com/iam/apikeys
2. Click en "Create an IBM Cloud API key"
3. Dale un nombre (ej: "pr-party-watsonx")
4. Copia la API key (solo se muestra una vez)

### 4. Verificar URL del Servicio

La URL depende de tu región:
- **US South**: `https://us-south.ml.cloud.ibm.com`
- **EU Frankfurt**: `https://eu-de.ml.cloud.ibm.com`
- **Tokyo**: `https://jp-tok.ml.cloud.ibm.com`

## ⚙️ Configuración

### 1. Crear archivo .env

```bash
cd backend
cp .env.example .env
```

### 2. Editar .env con tus credenciales

```env
# IBM watsonx.ai Configuration (REQUIRED)
WATSONX_API_KEY=tu_api_key_aqui
WATSONX_PROJECT_ID=tu_project_id_aqui
WATSONX_URL=https://us-south.ml.cloud.ibm.com

# Opcional
GITHUB_TOKEN=tu_github_token
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Granite Model Configuration (valores por defecto)
GRANITE_MODEL_ID=ibm/granite-3-3-8b-instruct
GRANITE_MAX_TOKENS=2048
GRANITE_TEMPERATURE=0.7
```

### 3. Instalar Dependencias

```bash
cd backend
pip install -r requirements.txt
```

### 4. Probar Conexión

```bash
python -c "
from app.clients.watsonx_client import get_watsonx_client
import asyncio

async def test():
    client = get_watsonx_client()
    result = await client.generate_text(
        model_id='ibm/granite-3-3-8b-instruct',
        prompt='Say hello',
        max_new_tokens=50
    )
    print('✅ watsonx.ai funciona!')
    print(f'Respuesta: {result}')

asyncio.run(test())
"
```

## 🚀 Ejecutar PR Party

### 1. Arrancar Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Deberías ver:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### 2. Arrancar Frontend (otra terminal)

```bash
cd apps/web
npm run dev
```

### 3. Probar

1. Abre http://localhost:3000
2. Selecciona un fixture (pr1, pr2, o pr3)
3. Click en "Start Analysis"
4. Verás el análisis con las 6 voces de personajes

## 🔄 Cómo Funciona el Pipeline

```
1. Usuario selecciona fixture → Frontend
2. Frontend llama /analyze/sync → Backend
3. Backend carga diff + context → Fixture Loader
4. Granite Pass 1 (Searcher) → Encuentra problemas
5. Granite Pass 2 (Validator) → Filtra ruido
6. Classifier → Asigna a personajes
7. Granite Pass 3 (Voice Rewriter) → Añade voces
8. Backend devuelve JSON → Frontend
9. Frontend muestra findings animados
```

## 🐛 Troubleshooting

### Error: "Authentication failed"
- Verifica que `WATSONX_API_KEY` sea correcta
- Comprueba que la API key no haya expirado
- Asegúrate de que tienes acceso a watsonx.ai

### Error: "Project not found"
- Verifica que `WATSONX_PROJECT_ID` sea correcto
- Comprueba que el proyecto existe en watsonx.ai
- Asegúrate de que la API key tiene acceso al proyecto

### Error: "Model not found"
- Verifica que `GRANITE_MODEL_ID` sea correcto
- Comprueba que tienes acceso al modelo Granite
- Prueba con: `ibm/granite-3-3-8b-instruct`

### Error: "IAM token expired"
- El cliente refresca tokens automáticamente
- Si falla, reinicia el backend
- Verifica que la API key sea válida

### Respuestas lentas
- Granite puede tardar 10-30s por pasada
- Es normal para diffs grandes
- Considera aumentar `GRANITE_MAX_TOKENS` si se corta

### JSON inválido en respuesta
- Granite a veces devuelve texto antes del JSON
- El parser extrae automáticamente bloques ```json```
- Si falla, revisa los prompts en `prompts/`

## 📊 Modelos Disponibles

| Modelo | Tamaño | Velocidad | Calidad |
|--------|--------|-----------|---------|
| granite-3-3-8b-instruct | 8B | ⚡⚡⚡ | ⭐⭐⭐⭐ |
| granite-3-3-34b-instruct | 34B | ⚡⚡ | ⭐⭐⭐⭐⭐ |
| granite-3-3-70b-instruct | 70B | ⚡ | ⭐⭐⭐⭐⭐ |

**Recomendado**: `granite-3-3-8b-instruct` (buen balance velocidad/calidad)

## 💰 Costos

watsonx.ai cobra por tokens:
- **Input tokens**: ~$0.0005 por 1K tokens
- **Output tokens**: ~$0.0015 por 1K tokens

Análisis típico de PR:
- Searcher: ~5K input + 2K output = $0.006
- Validator: ~3K input + 1K output = $0.003
- Voice Rewriter (x6): ~1K input + 0.5K output cada uno = $0.009
- **Total por PR**: ~$0.018

Con $80 de créditos: ~4,400 análisis de PRs

## 📚 Recursos

- [watsonx.ai Documentation](https://www.ibm.com/docs/en/watsonx-as-a-service)
- [Granite Models](https://www.ibm.com/granite)
- [IBM Cloud API Keys](https://cloud.ibm.com/iam/apikeys)
- [watsonx.ai Pricing](https://www.ibm.com/products/watsonx-ai/pricing)

## ✅ Checklist de Setup

- [ ] Cuenta IBM Cloud creada
- [ ] Proyecto watsonx.ai creado
- [ ] API key generada
- [ ] Project ID copiado
- [ ] `.env` configurado
- [ ] Dependencias instaladas (`pip install -r requirements.txt`)
- [ ] Conexión probada (script de test)
- [ ] Backend arrancado (puerto 8000)
- [ ] Frontend arrancado (puerto 3000)
- [ ] Análisis de fixture funcionando

## 🎉 ¡Listo!

Una vez completado el checklist, tu sistema está listo para analizar PRs con las 6 voces de personajes.

**Próximos pasos**:
1. Probar los 3 fixtures (pr1, pr2, pr3)
2. Verificar que las voces sean distintas
3. Ajustar prompts si es necesario
4. Grabar demo para submission