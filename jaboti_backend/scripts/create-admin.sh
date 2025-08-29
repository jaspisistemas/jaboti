#!/bin/bash

echo "========================================"
echo "    JABOTI - Criar Usuario Admin"
echo "========================================"
echo

echo "Escolha uma opcao:"
echo "1. Usuario admin padrao (admin/admin123)"
echo "2. Usuario admin personalizado"
echo "3. Sair"
echo

read -p "Digite sua escolha (1-3): " choice

case $choice in
    1)
        echo
        echo "Criando usuario admin padrao..."
        node scripts/create-admin-user.js
        ;;
    2)
        echo
        echo "Criando usuario admin personalizado..."
        node scripts/create-custom-admin.js
        ;;
    3)
        echo
        echo "Saindo..."
        exit 0
        ;;
    *)
        echo
        echo "Opcao invalida!"
        ;;
esac

echo
echo "Script concluido!"
