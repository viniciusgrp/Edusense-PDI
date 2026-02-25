# PDI - Plano de Desenvolvimento Individual

Esboço para demonstração do módulo PDI, baseado na proposta técnica e nos mockups da plataforma edusense.

## Tecnologias

- **HTML5** + **Tailwind CSS** (CDN) + **JavaScript vanilla**
- Sem build step - abra `index.html` diretamente no navegador

## Como executar

1. Abra o arquivo `index.html` no navegador (duplo clique ou arraste para o Chrome/Edge/Firefox)
2. Ou use um servidor local: `npx serve .` ou `python -m http.server 8080`

## Estrutura do Módulo

### 3 Visões (abas no topo)

1. **Visão do Aluno**
   - Lista de Habilidades (Valores e Comportamentos)
   - Clique em um nível para abrir modal de Ação
   - Modal: Metodologia (70-20-10), Ação (sugerida ou "Outro"), Datas, Status
   - **Regra de estado**: Ação salva = todos os campos desabilitados exceto Status
   - Exemplo: "Nível 2 - Conduzir reuniões com foco" simula ação já salva
   - Botão "Novo PDI" para criar novo plano

2. **Visão do Supervisor**
   - Grid "Meu Time" com cards de progresso dos colaboradores
   - Botão "Novo PDI para colaborador" - modal com seleção de usuário e contexto inicial
   - Opção de vincular a Template ou criar do zero

3. **Visão do Administrador**
   - Cadastro de **Valores** (com seus Comportamentos)
   - Aba **Níveis**: Toggle "Habilitar Ações" (70-20-10)
   - Quando ativado: aba **Ação** aparece dinamicamente
   - Aba Ação: formulário para adicionar ações sugeridas (título + pilar da metodologia)
   - Opção de vincular ação à Trilha Dinâmica

## Regras de Negócio (PDF)

- Valores → Comportamentos → Ações (metodologia 70-20-10)
- PDI pode ser criado pelo colaborador ou supervisor
- Após envio ao supervisor: apenas Status das ações é editável
- Vinculação opcional com Trilha Dinâmica

## Observações

- Protótipo estático - dados em memória/localStorage não persistidos
- Pontos 11 (APIs/Importação) e 12 (IA) desconsiderados conforme solicitado
