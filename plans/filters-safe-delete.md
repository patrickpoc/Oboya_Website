# Exclusão segura de filtros e taxonomia no admin

status: implementado, sem commit; e2e e teste manual pendentes · requested: 2026-11-05 · by: Patrick

## Context

Em Marketplace > Filters, o painel **Taxonomy Details** não permite apagar subcategorias. Os outros itens (categoria, marca, grupo, opção) têm exclusão, mas ela fica bloqueada quando estão em uso, sem mostrar onde nem oferecer como resolver.

**Resultado esperado:** qualquer item pode ser excluído. Se estiver em uso, o admin vê os produtos afetados e confirma a remoção ou a substituição em todos eles.

### Decisões do usuário

- **Campos obrigatórios** (subcategoria, categoria, marca): exigem um substituto, e os produtos são movidos para ele.
- **Filtros opcionais** (opção, grupo): são removidos dos produtos.
- **Abrangência:** todos os produtos, incluindo publicados, rascunhos, arquivados e os da lixeira. Solutions fica de fora.
- **Aprovação:** aplicação direta, com registro no log de auditoria e permissão `marketplace:edit`.

### Problemas atuais que afetam a funcionalidade

1. **Contagem de opções e grupos zerada no Supabase:** `filters/usage/route.ts:21` usa `fields: "table"`, cujas colunas (`PRODUCT_TABLE_COLUMNS`) não incluem `application`, `cultures`, `certifications` e `country_of_origin`.
2. **Trava do PUT incompleta:** `filters/route.ts:94` lê os produtos com o cliente público, sem `asAdmin`, e ignora a lixeira. Rascunhos e produtos na lixeira não contam como uso, então um item usado só por eles pode ser excluído.
3. **Subcategoria sem contagem:** a rota de uso não retorna `subcategoryUsage`.
4. **Fallback perigoso:** `readProducts` devolve os dados locais de seed quando a leitura falha. Isso é aceitável para exibir, mas não para basear uma escrita em massa.
5. **`customFilters` não persiste no Supabase:** esse campo não existe em `ProductRow`, então opções de grupos personalizados sempre aparecem com 0 usos. Isso continua igual e fica fora do escopo.

## Abordagem

Tudo fica em um novo endpoint de servidor, que altera os produtos e depois o documento de taxonomia. O fluxo do botão Save continua igual para o restante da página.

| Item em uso | Ação | Efeito nos produtos |
|---|---|---|
| Subcategoria | Substituir | `subcategoryId` e `categoryId` passam para o destino (qualquer categoria, o que cobre a última subcategoria de uma categoria) |
| Categoria | Substituir | Todos os produtos da categoria vão para uma única subcategoria de destino, fora da categoria excluída |
| Marca | Substituir | `brandId` passa para a marca de destino |
| Opção | Remover | O id sai da lista do grupo (`countryOfOrigin` fica `""`) |
| Grupo | Remover | Os valores do grupo são limpos nos produtos, usando `patchProductFilterValues` |

**Itens sem uso:** a exclusão continua local até o Save, como hoje. Isso inclui itens recém-criados e ainda não salvos.

## Tarefas

| # | Tarefa | Agente | Arquivos | Paralelo |
|---|---|---|---|---|
| 1 | Lógica pura: tipo do alvo (`kind`, `id`, `groupId`), encontrar produtos afetados, calcular o patch e remover o item do documento, com testes | builder-admin | novo `src/lib/cms/taxonomy-removal.ts` + `__tests__` | não |
| 2 | Leitura estrita de produtos, que lança erro em vez de usar o seed, e atualização parcial só das colunas de referência | builder-admin | `src/lib/cms/server/products/{reads,writes}.server.ts` | não |
| 3 | Corrigir a rota de uso (`fields: "list"`, `subcategoryUsage`, contar a lixeira) e a trava do PUT (`asAdmin`, `includeDeleted`) | builder-admin | `src/app/api/cms/marketplace/filters/route.ts`, `filters/usage/route.ts` | não |
| 4 | `GET filters/usage/products`: lista id, nome, SKU e status dos produtos afetados (`marketplace:view`) | builder-admin | novo route handler em `filters/usage/products/` | não |
| 5 | `POST filters/remove`: valida o alvo e o destino, atualiza os produtos, salva o documento, invalida o cache e registra a auditoria (`marketplace:edit`) | builder-admin | novo route handler em `filters/remove/` + teste | não |
| 6 | UI: botão de excluir subcategoria (no painel e na árvore), diálogo com lista de produtos e links, seletor de destino e estados de carregamento e erro | builder-admin | `filters/page.tsx`, novo componente em `src/components/admin/` | não |
| 7 | Copy em inglês (`admin.filters`) | builder-admin | `messages/en/admin.json` | não |
| 8 | Traduções | i18n | `messages/{pt-BR,es,zh-CN}/admin.json` | não |

Depois: `reviewer` e `security-reviewer` (o diff toca `src/app/api/**`). Antes de construir, este plano é copiado para `plans/filters-safe-delete.md`, conforme o fluxo do projeto.

### Detalhes importantes

- **Ordem de escrita:** primeiro os produtos, depois o documento. A operação é idempotente: se falhar no meio, o item continua visível e o admin pode repetir, e os produtos já alterados não entram de novo.
- **Falha parcial:** a resposta informa quantos produtos foram atualizados e quais falharam. O documento só é salvo se todos forem atualizados.
- **Atualização parcial:** não usar `saveProduct` com leitura `list`, pois `productToRow` grava `description` e a leitura `list` a deixa em branco. O código em `saveMarketplaceCurrencies` (`marketplace-config.server.ts:256-270`) parece ter esse risco; ele fica fora do escopo, mas será relatado.
- **Limite de produtos:** o limite de 30 da edição em massa não se aplica, e o endpoint processa em lotes no servidor.
- **Modo sem Supabase:** grava os produtos com `persistProductsToFileSafe` ao final.
- **Edições não salvas:** o endpoint altera só o item alvo no documento atual do servidor. O cliente aplica a mesma remoção ao estado local e ao snapshot de referência, preservando as demais edições pendentes. Depois recarrega as contagens, que hoje só são buscadas ao abrir a página.
- **Conflitos com edições locais:** os seletores de destino oferecem só itens já salvos, e o servidor rejeita destinos inexistentes ou iguais ao item excluído.
- **Produtos da lixeira:** são alterados como os demais, e a lista os identifica com um selo.
- **Componentes:** não há `AlertDialog` no projeto, então o diálogo usa `src/components/ui/dialog.tsx`.

## i18n

Novas chaves em `admin.filters`: excluir subcategoria, título e descrição do diálogo, "Usado em {count} produtos" (plural ICU), seletor de destino, ação de remover de todos os produtos, ação de mover e excluir, selos de status, sucesso e falha parcial.

## Critérios de aceite

- Subcategoria sem uso pode ser excluída no painel e persiste após o Save.
- Item em uso abre o diálogo com a contagem correta e a lista de produtos, incluindo rascunhos e lixeira.
- Subcategoria, categoria e marca em uso só podem ser excluídas após escolher um destino válido, e nenhum produto fica com referência vazia ou inválida.
- Opção e grupo em uso são removidos de todos os produtos, sem alterar os outros valores nem campos como `description`.
- Edições não salvas de outros itens continuam após a exclusão.
- As contagens de opções e grupos ficam corretas no Supabase, e a loja pública reflete a mudança depois da invalidação do cache.
- Cada operação gera um registro de auditoria, e usuários sem `marketplace:edit` recebem erro de permissão.

## Verificação

1. Testes em Vitest da lógica pura e da rota `remove`: cada tipo de item, destino inválido, falha parcial e nova tentativa.
2. `npm run lint && npm run i18n:check && npm test && npm run build && npm run test:e2e`.
3. No app rodando com banco de teste, conferir cada cenário de exclusão, a descrição preservada no produto, o filtro na loja pública e um produto restaurado da lixeira sem referência quebrada.

## Riscos e fora do escopo

- **Sem desfazer automático:** a substituição não guarda o vínculo anterior. O diálogo deixa isso explícito e a auditoria registra os ids afetados.
- **Solutions:** páginas que apontam para um item excluído têm o valor ignorado em silêncio pela loja (`resolveShopFilters`). Fica para uma melhoria futura.
- **Sem migração de banco:** a taxonomia é um documento JSON e as colunas já existem.
- **Fora do escopo:** persistir `customFilters` no Supabase e corrigir `saveMarketplaceCurrencies`. Ambos serão relatados ao final.
