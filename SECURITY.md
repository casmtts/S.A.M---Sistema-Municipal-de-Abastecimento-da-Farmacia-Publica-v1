# Política de segurança

## Reportar uma vulnerabilidade
Não abra issue pública. Use o recurso **Security → Report a vulnerability** do repositório no GitHub. Descreva o impacto, os passos para reproduzir e a versão afetada. Não inclua dados reais de pacientes.

## Controles existentes
- Sessão por cookie `HttpOnly`; o token não fica no `localStorage`.
- Senhas com bcrypt; autenticação JWT de curta duração (15 min por padrão).
- Autorização por papel e por permissão em cada operação.
- Validação de DTOs com `whitelist` e `forbidNonWhitelisted`.
- Helmet com CSP, CORS restrito por lista, bloqueio de origem inválida em requisições que alteram dados, limite de corpo de 100 KB e rate limit.
- Auditoria com hashes encadeados e verificação de integridade.
- Validação de variáveis de ambiente na inicialização; segredos fracos são recusados em produção.

## Sessão e autenticação
- Cookie `HttpOnly` + `SameSite=Strict` (+ `Secure` em produção) com **rotação do token a cada 10 minutos** em requisições autenticadas, vida máxima absoluta de 8 h e revogação imediata por `tokenVersion`.
- Autorização (papel, permissões, conta ativa) reavaliada no banco a cada requisição, não confiada ao conteúdo do token.
- JWT com algoritmo fixado (HS256); senhas de 10 a 72 caracteres com bcrypt (custo 12); nova senha deve diferir da atual.
- Login com limite por IP, bloqueio por conta e resposta de tempo uniforme para contas inexistentes; cadastro público não devolve dados da conta.
- Admin não pode desativar ou remover a própria conta; ativação/desativação valida o corpo com DTO booleano.

## Endurecimento aplicado nesta revisão
- Contêiner do backend roda como usuário não-root e tem `HEALTHCHECK`.
- Banco de desenvolvimento publicado apenas em `127.0.0.1`.
- `docker-compose.prod.yml` exige `AUDIT_IDENTIFIER_SECRET` (antes o backend não subia em produção).
- CSP do frontend limitada a `fonts.googleapis.com` e `fonts.gstatic.com` para fontes.
- Dependabot e workflow de segurança já configurados em `.github/`.

## Antes de operar com dados reais
Defina segredos fortes e únicos (`JWT_SECRET`, `AUDIT_IDENTIFIER_SECRET`), HTTPS, `TRUST_PROXY` correto atrás do proxy, backups, retenção, gestão de incidentes e base legal (LGPD). Rode `npm audit` no backend e no frontend a cada atualização.

## Privacidade e LGPD (adicionado em 2026-11)

- CPF é mascarado em exportações; planilhas neutralizam injeção de fórmulas (`backend/src/common/utils/privacy.util.ts`).
- Pedidos de titulares têm prazo de 15 dias com sinalização de atraso; dados sob guarda legal não são apagados.
- Incidentes envolvendo dados pessoais: siga [docs/lgpd/05-plano-de-incidentes.md](docs/lgpd/05-plano-de-incidentes.md) (comunicação à ANPD e aos titulares em até 3 dias úteis).
- Pacote completo: [docs/lgpd/](docs/lgpd/README.md).

