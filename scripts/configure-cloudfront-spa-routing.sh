#!/bin/bash

# Script para configurar CloudFront Custom Error Responses para SPA routing
# Uso: ./configure-cloudfront-spa-routing.sh DISTRIBUTION_ID

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Debes proporcionar el Distribution ID"
    echo "Uso: $0 DISTRIBUTION_ID"
    echo ""
    echo "Ejemplo:"
    echo "  $0 E1234567890ABC"
    exit 1
fi

DISTRIBUTION_ID="$1"

echo "🔍 Obteniendo configuración actual de CloudFront..."
echo "   Distribution ID: $DISTRIBUTION_ID"

# Obtener la configuración actual
TEMP_CONFIG=$(mktemp)
aws cloudfront get-distribution-config \
    --id "$DISTRIBUTION_ID" \
    --output json > "$TEMP_CONFIG"

# Extraer ETag
ETAG=$(jq -r '.ETag' "$TEMP_CONFIG")

# Extraer la configuración
DIST_CONFIG=$(jq -r '.DistributionConfig' "$TEMP_CONFIG")

# Verificar si ya tiene CustomErrorResponses configurados
CURRENT_ERRORS=$(echo "$DIST_CONFIG" | jq -r '.CustomErrorResponses // empty')

# Crear la nueva configuración de CustomErrorResponses
NEW_ERROR_RESPONSES=$(cat <<EOF
{
  "Quantity": 2,
  "Items": [
    {
      "ErrorCode": 403,
      "ResponsePagePath": "/index.html",
      "ResponseCode": "200",
      "ErrorCachingMinTTL": 300
    },
    {
      "ErrorCode": 404,
      "ResponsePagePath": "/index.html",
      "ResponseCode": "200",
      "ErrorCachingMinTTL": 300
    }
  ]
}
EOF
)

# Verificar si ya existe la configuración
if [ -n "$CURRENT_ERRORS" ]; then
    HAS_403=$(echo "$CURRENT_ERRORS" | jq -r '.Items[]? | select(.ErrorCode == 403) // empty')
    HAS_404=$(echo "$CURRENT_ERRORS" | jq -r '.Items[]? | select(.ErrorCode == 404) // empty')
    
    if [ -n "$HAS_403" ] && [ -n "$HAS_404" ]; then
        echo "✅ Los Custom Error Responses ya están configurados correctamente"
        echo "   - 403 → /index.html (200)"
        echo "   - 404 → /index.html (200)"
        rm "$TEMP_CONFIG"
        exit 0
    fi
fi

# Actualizar la configuración
echo "📝 Actualizando configuración de CloudFront..."

UPDATED_CONFIG=$(echo "$DIST_CONFIG" | jq --argjson errors "$NEW_ERROR_RESPONSES" '.CustomErrorResponses = $errors')

# Guardar la configuración actualizada
UPDATED_CONFIG_FILE=$(mktemp)
echo "$UPDATED_CONFIG" > "$UPDATED_CONFIG_FILE"

# Actualizar la distribución
echo "🚀 Aplicando cambios..."
aws cloudfront update-distribution \
    --id "$DISTRIBUTION_ID" \
    --if-match "$ETAG" \
    --distribution-config "file://$UPDATED_CONFIG_FILE" \
    --output json > /dev/null

# Limpiar archivos temporales
rm "$TEMP_CONFIG" "$UPDATED_CONFIG_FILE"

echo ""
echo "✅ Configuración aplicada exitosamente!"
echo ""
echo "📋 Custom Error Responses configurados:"
echo "   - 403 (Forbidden) → /index.html (200 OK)"
echo "   - 404 (Not Found) → /index.html (200 OK)"
echo ""
echo "⏳ Los cambios pueden tardar 5-15 minutos en propagarse"
echo "   Verifica el estado con:"
echo "   aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.Status' --output text"
echo ""
echo "💡 Cuando el estado sea 'Deployed', prueba acceder a:"
echo "   https://tu-dominio.com/login/"
echo "   (sin el index.html)"

