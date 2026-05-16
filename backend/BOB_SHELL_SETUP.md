# Bob Shell Setup Guide

Este documento explica cómo configurar IBM Bob Shell para usar con PR Party.

## ¿Qué es Bob Shell?

Bob Shell es la interfaz de línea de comandos (CLI) de IBM Bob IDE que permite:
- Ejecutar Bob en sesiones no interactivas
- Automatizar análisis de código en pipelines CI/CD
- Autenticar con API key en lugar de navegador

## Requisitos Previos

1. **Instalar Bob IDE**: Descarga e instala Bob IDE desde el portal de IBM
2. **Obtener API Key**: 
   - Abre Bob IDE
   - Ve a Settings > API Keys
   - Crea una nueva API key (tipo: General o Inference)
   - Copia la clave (solo se muestra una vez)

## Configuración

### 1. Instalar Bob Shell

Bob Shell se instala automáticamente con Bob IDE. Verifica la instalación:

```bash
bob --version
```

Si el comando no se encuentra, añade Bob al PATH:
- **Windows**: `C:\Program Files\Bob\bin`
- **macOS**: `/Applications/Bob.app/Contents/MacOS`
- **Linux**: `/opt/bob/bin`

### 2. Configurar API Key

Crea el archivo `backend/.env` con tu API key:

```bash
cd backend
cp .env.example .env
```

Edita `.env` y añade tu clave:

```env
# IBM Bob Shell Configuration
BOB_API_KEY=tu_clave_api_aqui

# IBM watsonx.ai Configuration
WATSONX_API_KEY=tu_watsonx_key_aqui
WATSONX_PROJECT_ID=tu_project_id_aqui
WATSONX_URL=https://us-south.ml.cloud.ibm.com
```

### 3. Probar Bob Shell

Prueba que Bob Shell funciona con tu API key:

```bash
# Exportar la clave (temporal)
export BOB_API_KEY=tu_clave_api_aqui

# Probar Bob Shell
echo "Analiza este código: console.log('test')" | bob --output text
```

Deberías ver una respuesta de Bob analizando el código.

## Uso en PR Party

El backend de PR Party usa Bob Shell automáticamente:

1. **Searcher Pass**: Bob analiza el diff y encuentra problemas
2. **Validator Pass**: Bob filtra ruido de los findings

El `BobClient` ejecuta Bob Shell con:
```bash
bob --prompt-file <archivo> --max-tokens 8192 --output text
```

## Comandos Útiles de Bob Shell

```bash
# Ayuda
bob --help

# Analizar con prompt desde archivo
bob --prompt-file prompt.txt --output text

# Analizar con prompt directo
echo "Tu prompt aquí" | bob --output text

# Especificar max tokens
bob --prompt-file prompt.txt --max-tokens 4096

# Con system prompt
bob --prompt-file prompt.txt --system "Eres un experto en seguridad"
```

## Troubleshooting

### Error: "bob: command not found"
- Verifica que Bob IDE esté instalado
- Añade Bob al PATH del sistema
- Reinicia la terminal después de añadir al PATH

### Error: "Authentication failed"
- Verifica que `BOB_API_KEY` esté configurado en `.env`
- Comprueba que la API key sea válida en Bob IDE > Settings > API Keys
- Asegúrate de que la key no haya expirado

### Error: "Timeout"
- Los diffs grandes pueden tardar >5 minutos
- Aumenta `timeout` en `BobClient` si es necesario
- Considera dividir el análisis en chunks más pequeños

### Error: "Invalid response format"
- Bob Shell debe devolver JSON válido
- Verifica que el prompt pida explícitamente formato JSON
- Revisa los prompts en `prompts/bob_searcher.md` y `prompts/bob_validator.md`

## Alternativa: Usar Solo watsonx.ai

Si Bob Shell no está disponible o prefieres simplificar, puedes modificar el backend para usar solo Granite (watsonx.ai):

1. Comentar las llamadas a Bob en `orchestrator.py`
2. Usar Granite para Searcher + Validator + Voice Rewriter
3. Mantener el mismo flujo de 2 pasadas (Mythos pattern)

Ver `WATSONX_ONLY_MODE.md` para instrucciones detalladas.

## Recursos

- [Bob IDE Documentation](https://ibm.com/bob)
- [Bob Shell CLI Reference](https://ibm.com/bob/cli)
- [API Keys Management](https://ibm.com/bob/api-keys)

## Soporte

Si tienes problemas con Bob Shell:
1. Verifica la documentación oficial de IBM Bob
2. Revisa los logs en `backend/` (modo DEBUG)
3. Contacta al soporte de IBM Bob con tu API key ID (no la key completa)