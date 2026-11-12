import { Children, forwardRef, isValidElement, useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import {
  Add, AdminPanelSettings, Apartment, Assessment, CheckCircleOutline, Dashboard as DashboardIcon, DeleteOutline, EditOutlined,
  Groups, Inventory2, Login, Logout, Menu, MoreHoriz, Search,
  NotificationsNone, ShoppingCart, SwapHoriz, TrendingUp, Visibility, VisibilityOff, WarningAmber,
} from '@mui/icons-material';
import {
  Alert, Avatar, Badge, Box, Button as MuiButton, Checkbox, Chip, CssBaseline, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, Drawer, IconButton as MuiIconButton, InputAdornment, LinearProgress, Menu as MuiMenu, MenuItem,
  Paper, Pagination, PaginationItem, Select, Snackbar, Stack, TextField, ThemeProvider, Tooltip as MuiTooltip, Typography, createTheme,
} from '@mui/material';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { getApiErrorMessage } from './services/api';
import { cpfValido, formatarCpf, formatarTelefone, somenteNumeros, telefoneValido } from './utils/brasil';
import './App.css';
import './profile-menu.css';

type Page = 'dashboard' | 'estoque' | 'pedidos' | 'cadastros' | 'relatorios' | 'usuarios';
type Medicine = { id: string; nome: string; principioAtivo: string; apresentacao: string; estoque: number; minimo: number; maximo: number; validade: string; fornecedor: string; fornecedorId?: string; preco: number; raw?: any };
type OrderStatus = 'Pendente' | 'Em análise' | 'Aprovado' | 'Em entrega' | 'Entregue' | 'Cancelado';
type Order = { id: string; unidade: string; medicamento: string; medicamentoId: string; quantidade: number; data: string; status: OrderStatus; raw?: any };
type Entity = { id: string; nome: string; detalhe: string; status: boolean; raw?: any };
type Role = { id: string; nome: string; descricao: string };
type PermissionValue = { chave: string; modulo: string; acao: string; nome: string; permitido: boolean };
type AuditLog = { id: string; sequencia: string; previousHash: string; eventHash: string; createdAt: string; usuarioNome?: string; usuarioEmail?: string; acao: string; modulo: string; recurso?: string; recursoId?: string; descricao: string; ip?: string; sucesso: boolean; dadosAntes?: any; dadosDepois?: any };
type AuditOptions = { acoes: string[]; modulos: string[]; recursos: string[]; usuarios: { id: string; nome: string; email?: string }[]; status: { valor: string; nome: string }[] };
type User = { id: string; nome: string; email: string; funcao: string; roleId: string | null; status: boolean; raw?: any };
type Modal = 'medicine' | 'movement' | 'order' | 'entity' | 'user' | null;

const roles: Role[] = [
  { id: 'SUPER_ADMIN', nome: 'Super administrador', descricao: 'Acesso total e protegido do sistema.' },
  { id: 'ADMIN', nome: 'Administrador', descricao: 'Acesso completo à plataforma.' },
  { id: 'GESTOR', nome: 'Gestor', descricao: 'Opera estoque e acompanha pedidos.' },
  { id: 'FARMACEUTICO', nome: 'Farmacêutico', descricao: 'Consulta e movimenta medicamentos.' },
  { id: 'ATENDENTE', nome: 'Atendente', descricao: 'Registra solicitações e consulta o estoque.' },
  { id: 'CONSULTOR', nome: 'Consultor', descricao: 'Acesso de consulta a relatórios.' },
];
const roleLabels = Object.fromEntries(roles.map(role => [role.id, role.nome]));
const permissionModuleLabels: Record<string, string> = { dashboard: 'Visão geral', estoque: 'Estoque', pedidos: 'Pedidos', fornecedores: 'Fornecedores', unidades: 'Unidades de saúde', usuarios: 'Usuários', relatorios: 'Relatórios', auditoria: 'Auditoria', permissoes: 'Permissões', privacidade: 'Privacidade' };
const cargoOptions = ['Farmacêutico Responsável Técnico', 'Farmacêutico', 'Atendente / Dispensador de Farmácia', 'Gestor Municipal de Saúde'];
const brazilianStates = [
  ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'], ['BA', 'Bahia'],
  ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'], ['GO', 'Goiás'],
  ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'], ['MG', 'Minas Gerais'],
  ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'], ['PE', 'Pernambuco'], ['PI', 'Piauí'],
  ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'], ['RS', 'Rio Grande do Sul'],
  ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'], ['SP', 'São Paulo'],
  ['SE', 'Sergipe'], ['TO', 'Tocantins'],
] as const;
const orderLabels: Record<string, OrderStatus> = { PENDENTE: 'Pendente', EM_ANALISE: 'Em análise', APROVADO: 'Aprovado', ENVIADO: 'Em entrega', ENTREGUE: 'Entregue', CANCELADO: 'Cancelado' };
const nav = [
  { page: 'dashboard' as Page, label: 'Visão geral', icon: <DashboardIcon /> },
  { page: 'estoque' as Page, label: 'Estoque de Medicamentos', icon: <Inventory2 /> },
  { page: 'pedidos' as Page, label: 'Pedidos da Rede', icon: <ShoppingCart /> },
  { page: 'cadastros' as Page, label: 'Cadastros / Fornecedores', icon: <Apartment /> },
  { page: 'relatorios' as Page, label: 'Relatórios & Análises', icon: <Assessment /> },
  { page: 'usuarios' as Page, label: 'Usuários & Permissões', icon: <Groups /> },
];
const sansStack = 'Manrope, "Avenir Next", "Segoe UI Variable", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif';
const theme = createTheme({ palette: { primary: { main: '#1d5fd1' }, secondary: { main: '#3dd5f3' }, error: { main: '#e5484d' }, warning: { main: '#e9a23b' }, success: { main: '#2fbf8f' }, info: { main: '#1d5fd1' }, background: { default: '#eef3f9', paper: '#ffffff' }, text: { primary: '#0b1b33', secondary: '#55687f' }, divider: '#d8e2ee' }, typography: { fontFamily: sansStack, h3: { fontWeight: 800 }, h4: { fontWeight: 800 }, h5: { fontWeight: 800 }, h6: { fontWeight: 800 }, button: { textTransform: 'none', fontWeight: 700 } }, shape: { borderRadius: 10 } });
function getButtonTooltipText(children: ReactNode): string {
  const labels: string[] = [];
  Children.forEach(children, child => {
    if (typeof child === 'string' || typeof child === 'number') {
      labels.push(String(child));
    } else if (isValidElement(child)) {
      const props = child.props as { children?: ReactNode; label?: ReactNode };
      if (typeof props.label === 'string' || typeof props.label === 'number') labels.push(String(props.label));
      else if (props.children) labels.push(getButtonTooltipText(props.children));
    }
  });
  return labels.join(' ').replace(/\s+/g, ' ').trim();
}
type AccessibleButtonProps = React.ComponentProps<typeof MuiButton> & { disableTooltip?: boolean };
type AccessibleIconButtonProps = React.ComponentProps<typeof MuiIconButton> & { disableTooltip?: boolean };
const Button = forwardRef<HTMLButtonElement, AccessibleButtonProps>(function Button(props, ref) {
  const { children, title, disabled, disableTooltip, ...buttonProps } = props;
  const tooltip = title || props['aria-label'] || getButtonTooltipText(children) || 'Ação';
  const button = <MuiButton {...buttonProps} ref={ref} disabled={disabled}>{children}</MuiButton>;
  if (disableTooltip) return button;
  return <MuiTooltip title={tooltip} describeChild arrow enterDelay={350}>{disabled ? <span className="accessible-disabled-button" tabIndex={0}>{button}</span> : button}</MuiTooltip>;
});
const IconButton = forwardRef<HTMLButtonElement, AccessibleIconButtonProps>(function IconButton(props, ref) {
  const { children, title, disabled, disableTooltip, ...buttonProps } = props;
  const tooltip = title || props['aria-label'] || getButtonTooltipText(children) || 'Ação';
  const button = <MuiIconButton {...buttonProps} ref={ref} disabled={disabled}>{children}</MuiIconButton>;
  if (disableTooltip) return button;
  return <MuiTooltip title={tooltip} describeChild arrow enterDelay={350}>{disabled ? <span className="accessible-disabled-button" tabIndex={0}>{button}</span> : button}</MuiTooltip>;
});
function AccessiblePagination(props: React.ComponentProps<typeof Pagination>) {
  return <Pagination {...props} renderItem={item => {
    const tooltip = item.type === 'page' ? `Ir para a página ${item.page}` : ({ first: 'Primeira página', last: 'Última página', next: 'Próxima página', previous: 'Página anterior', 'start-ellipsis': 'Páginas anteriores', 'end-ellipsis': 'Próximas páginas' } as Record<string, string>)[item.type] || 'Navegar páginas';
    return <MuiTooltip title={tooltip} describeChild arrow enterDelay={350}><PaginationItem {...item} /></MuiTooltip>;
  }} />;
}
const formatDate = (value?: string | Date | null) => value ? new Date(value).toLocaleDateString('pt-BR') : '—';
const toDateInput = (value?: string | Date | null) => value ? new Date(value).toISOString().slice(0, 10) : '';
const status = (medicine: Medicine) => medicine.estoque <= medicine.minimo / 2 ? 'Crítico' : medicine.estoque <= medicine.minimo ? 'Baixo' : 'Regular';
const auditModuleLabel = (value?: string) => value?.toLowerCase() === 'auth' ? 'autenticação' : value || '—';
const normalizeMedicine = (item: any): Medicine => ({ id: item.id, nome: item.nome, principioAtivo: item.principioAtivo || item.nome, apresentacao: [item.concentracao, item.formaFarmaceutica].filter(Boolean).join(' · ') || 'Não informado', estoque: item.quantidadeAtual, minimo: item.quantidadeMinima, maximo: item.quantidadeMaxima, validade: formatDate(item.validade), fornecedor: item.fornecedor?.nome || 'Sem fornecedor', fornecedorId: item.fornecedorId || item.fornecedor?.id, preco: item.precoUnitario, raw: item });
const normalizeOrder = (item: any): Order => ({ id: item.id, unidade: item.solicitante?.nome || 'Unidade não informada', medicamento: item.medicamentoNome || item.medicamento?.nome, medicamentoId: item.medicamentoId, quantidade: item.quantidadeSolicitada, data: formatDate(item.dataSolicitacao || item.createdAt), status: orderLabels[item.status] || 'Pendente', raw: item });
const normalizeSupplier = (item: any): Entity => ({ id: item.id, nome: item.nome, detalhe: [item.cidade && item.uf ? `${item.cidade}, ${item.uf}` : item.cidade, item.prazoEntrega ? `Prazo médio: ${item.prazoEntrega} dias` : null].filter(Boolean).join(' · ') || 'Sem detalhes', status: item.ativo, raw: item });
const normalizeUnit = (item: any): Entity => ({ id: item.id, nome: item.nome, detalhe: [item.tipo, item.codigo, item.cidade && item.uf ? `${item.cidade}, ${item.uf}` : item.cidade].filter(Boolean).join(' · '), status: item.ativo, raw: item });
const normalizeUser = (item: any): User => ({ id: item.id, nome: item.nome, email: item.email, funcao: roleLabels[item.role] || item.role, roleId: item.role || null, status: item.ativo, raw: item });

function App() {
  const [logged, setLogged] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [page, setPage] = useState<Page>('dashboard');
  const [mobile, setMobile] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [privacyRequests, setPrivacyRequests] = useState<any[]>([]);
  const [privacyTabFocus, setPrivacyTabFocus] = useState(0);
  const [movements, setMovements] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Entity[]>([]);
  const [units, setUnits] = useState<Entity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [modal, setModal] = useState<Modal>(null);
  const [editing, setEditing] = useState<any>(null);
  const [catalog, setCatalog] = useState<'fornecedores' | 'unidades'>('fornecedores');
  const [toast, setToast] = useState('');
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLElement | null>(null);
  const [seenNotificationKeys, setSeenNotificationKeys] = useState<Set<string>>(() => new Set());
  const [profileOpen, setProfileOpen] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [globalSearchValue, setGlobalSearchValue] = useState('');
  const [searchRequest, setSearchRequest] = useState<{ page: Page; query: string; catalog?: 'fornecedores' | 'unidades'; token: number } | null>(null);
  const sessionCheckStarted = useRef(false);
  const pageHistory = useRef<Page[]>([]);
  useEffect(() => {
    const closeAnchoredMenus = () => {
      setProfileAnchor(null);
      setNotificationAnchor(null);
    };
    window.addEventListener('resize', closeAnchoredMenus);
    return () => window.removeEventListener('resize', closeAnchoredMenus);
  }, []);
  useEffect(() => { setSeenNotificationKeys(new Set()); }, [currentUser?.id]);
  const show = (message: string) => setToast(message);
  const open = (kind: Modal, item: any = null) => { setEditing(item); setModal(kind); };
  const loadData = useCallback(async () => {
    if (!logged) return;
    try {
      const isAdministrator = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser?.role);
      const [meds, ords, supplierResult, unitResult, userResult, movementResult, privacyResult] = await Promise.all([
        api.get('/medicamentos').catch(() => ({ data: [] })), api.get('/pedidos').catch(() => ({ data: [] })), api.get('/fornecedores').catch(() => ({ data: [] })), api.get('/unidades-saude').catch(() => ({ data: [] })), api.get('/usuarios').catch(() => ({ data: [] })), api.get('/movimentacoes').catch(() => ({ data: [] })), isAdministrator ? api.get('/privacidade/solicitacoes/todas').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);
      setMedicines(meds.data.map(normalizeMedicine)); setOrders(ords.data.map(normalizeOrder)); setSuppliers(supplierResult.data.map(normalizeSupplier)); setUnits(unitResult.data.map(normalizeUnit)); setUsers(userResult.data.map(normalizeUser)); setMovements(Array.isArray(movementResult.data) ? movementResult.data : []); setPrivacyRequests(Array.isArray(privacyResult.data) ? privacyResult.data : []);
    } catch (error: unknown) { show(getApiErrorMessage(error, 'Não foi possível carregar os dados da operação.')); }
  }, [logged, currentUser?.role]);
  useEffect(() => { if (logged) loadData(); }, [logged, loadData]);
  const loadPermissions = useCallback(async () => { if (!logged) return; try { const { data } = await api.get('/permissoes/minhas'); setPermissions(data); } catch { setPermissions([]); } }, [logged]);
  useEffect(() => { if (logged) loadPermissions(); }, [logged, loadPermissions]);
  useEffect(() => { if (!sessionCheckStarted.current) { sessionCheckStarted.current = true; void api.get('/auth/session').then(({ data }) => { if (data.usuario) { setCurrentUser(data.usuario); setLogged(true); } else { setCurrentUser(null); setLogged(false); } }).catch(() => { setCurrentUser(null); setLogged(false); }); } const reset = () => { pageHistory.current = []; setCurrentUser(null); setLogged(false); setPermissions([]); setMedicines([]); setOrders([]); setUsers([]); setPrivacyRequests([]); }; window.addEventListener('sam:unauthorized', reset); return () => window.removeEventListener('sam:unauthorized', reset); }, []);
  const canPage = (target: Page) => { if (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' || permissions.length === 0) return true; const required = ({ dashboard: 'dashboard.visualizar', estoque: 'estoque.visualizar', pedidos: 'pedidos.visualizar', cadastros: ['fornecedores.visualizar', 'unidades.visualizar'], relatorios: 'relatorios.visualizar', usuarios: 'usuarios.visualizar' } as Record<Page, string | string[]>)[target]; return Array.isArray(required) ? required.some(permission => permissions.includes(permission)) : permissions.includes(required); };
  useEffect(() => { if (logged && permissions.length > 0 && !canPage(page)) setPage('dashboard'); }, [logged, permissions, page, currentUser?.role]);
  const handleLogin = async (email: string, senha: string) => {
    await api.post('/auth/login', { email, senha });
    // Só libera as rotas protegidas depois que o backend confirmar o cookie HttpOnly.
    const { data } = await api.get('/auth/session');
    if (!data.usuario) throw new Error('Não foi possível iniciar a sessão. Verifique se o navegador aceitou o cookie e tente novamente.');
    setCurrentUser(data.usuario);
    setLogged(true);
  };
  const handleRegister = async (payload: { nome: string; email: string; cpf: string; senha: string; telefone?: string; cargo?: string }) => { const { data } = await api.post('/auth/register', payload); return data; };
  const logout = async () => { try { if (logged) await api.post('/auth/logout'); } catch { /* logout local continua mesmo se a API estiver indisponível */ } finally { pageHistory.current = []; setLogged(false); setCurrentUser(null); setPermissions([]); setMedicines([]); setOrders([]); setUsers([]); setPrivacyRequests([]); } };
  const requestPrivacyAction = async (tipo: 'ACESSO' | 'CORRECAO' | 'ELIMINACAO') => { try { const descricao = tipo === 'CORRECAO' ? window.prompt('Descreva os dados que precisam de correção:') || '' : ''; await api.post('/privacidade/solicitacoes', { tipo, descricao }); await loadData(); show('Solicitação registrada para análise do administrador.'); } catch (error: unknown) { show(getApiErrorMessage(error, 'Não foi possível registrar a solicitação.')); } };
  const resolvePrivacyRequest = async (request: any, status: 'EM_ANALISE' | 'CONCLUIDA' | 'RECUSADA') => { const resposta = status === 'EM_ANALISE' ? undefined : window.prompt(status === 'CONCLUIDA' ? 'Registre a resposta ou providência adotada:' : 'Informe o motivo da recusa:'); if (status !== 'EM_ANALISE' && !resposta?.trim()) return; try { await api.patch(`/privacidade/solicitacoes/${request.id}`, { status, resposta: resposta?.trim() }); await loadData(); show(status === 'EM_ANALISE' ? 'Solicitação colocada em análise.' : status === 'CONCLUIDA' ? 'Solicitação concluída.' : 'Solicitação recusada.'); } catch (error: unknown) { show(getApiErrorMessage(error, 'Não foi possível atualizar a solicitação.')); } };
  const saveMedicine = async (form: FormData) => { const estoque = Number(form.get('estoque')); const minimo = Number(form.get('minimo')); const precoInput = String(form.get('preco') ?? '').trim(); const precoUnitario = Number(precoInput.includes(',') ? precoInput.replace(/\./g, '').replace(',', '.') : precoInput); if (!Number.isFinite(precoUnitario) || precoUnitario < 0) throw new Error('Informe um preço unitário válido.'); const lote = String(form.get('lote') || '').trim(); const payload = { nome: String(form.get('nome')), principioAtivo: String(form.get('principioAtivo') || form.get('nome')), concentracao: String(form.get('concentracao') || ''), formaFarmaceutica: String(form.get('formaFarmaceutica') || ''), lote: lote || undefined, validade: new Date(`${String(form.get('validade'))}T00:00:00.000Z`), quantidadeAtual: estoque, quantidadeMinima: minimo, quantidadeMaxima: Number(form.get('maximo') || Math.max(estoque, minimo * 2)), precoUnitario, fornecedorId: String(form.get('fornecedorId') || '') || undefined }; if (editing) await api.patch(`/medicamentos/${editing.id}`, payload); else await api.post('/medicamentos', payload); await loadData(); setModal(null); show(editing ? 'Medicamento atualizado.' : 'Medicamento adicionado ao estoque.'); };
  const saveOrder = async (form: FormData) => { await api.post('/pedidos', { medicamentoId: String(form.get('medicamentoId')), quantidadeSolicitada: Number(form.get('quantidade')), dataPrevistaEntrega: new Date(`${String(form.get('dataPrevistaEntrega'))}T00:00:00.000Z`), justificativa: String(form.get('justificativa') || '') }); await loadData(); setModal(null); show('Pedido criado com sucesso.'); };
  const saveEntity = async (form: FormData) => { if (catalog === 'fornecedores') { const payload = { nome: String(form.get('nome')), cnpj: String(form.get('cnpj') || editing?.raw?.cnpj || `PENDENTE-${Date.now()}`), cidade: String(form.get('cidade') || ''), uf: String(form.get('uf') || ''), prazoEntrega: Number(form.get('prazoEntrega') || 7), ativo: true }; if (editing) await api.patch(`/fornecedores/${editing.id}`, payload); else await api.post('/fornecedores', payload); } else { const payload = { nome: String(form.get('nome')), codigo: String(form.get('codigo') || editing?.raw?.codigo || `UN-${Date.now()}`), tipo: String(form.get('tipo') || 'UBS'), cidade: String(form.get('cidade') || ''), uf: String(form.get('uf') || ''), responsavel: String(form.get('responsavel') || ''), ativo: true }; if (editing) await api.patch(`/unidades-saude/${editing.id}`, payload); else await api.post('/unidades-saude', payload); } await loadData(); setModal(null); show('Cadastro salvo.'); };
  const saveUser = async (form: FormData) => { const payload: any = { nome: String(form.get('nome')), email: String(form.get('email')), cpf: String(form.get('cpf') || editing?.raw?.cpf || `PENDENTE-${Date.now()}`), role: String(form.get('roleId') || 'ATENDENTE'), telefone: String(form.get('telefone') || ''), cargo: String(form.get('cargo') || '') }; if (!editing) payload.senha = String(form.get('senha')); if (editing) await api.patch(`/usuarios/${editing.id}`, payload); else await api.post('/usuarios', payload); await loadData(); setModal(null); show('Usuário salvo.'); };
  const toggleUserStatus = async (user: User) => { try { await api.patch(`/usuarios/${user.id}/toggle`, { ativo: !user.status }); await loadData(); show(user.status ? 'Usuário desativado.' : 'Cadastro aprovado. Usuário liberado para login.'); } catch (error: unknown) { show(getApiErrorMessage(error, 'Não foi possível atualizar o acesso.')); } };
  const remove = async (id: string, endpoint: string, label: string) => { try { await api.delete(`${endpoint}/${id}`); await loadData(); show(`${label} inativado. Histórico preservado.`); } catch (error: unknown) { show(getApiErrorMessage(error, `Não foi possível remover ${label.toLowerCase()}.`)); } };
  const advanceOrder = async (order: Order) => { try { if (order.status === 'Pendente') await api.patch(`/pedidos/${order.id}/aprovar`); else if (order.status === 'Aprovado' || order.status === 'Em entrega') await api.patch(`/pedidos/${order.id}/entregar`, { quantidade: order.quantidade }); else return; await loadData(); show('Status do pedido atualizado.'); } catch (error: unknown) { show(getApiErrorMessage(error, 'Não foi possível atualizar o pedido.')); } };
  const content = () => { if (page === 'dashboard') return <DashboardView medicines={medicines} orders={orders} currentUser={currentUser} onGo={navigatePage} />; if (page === 'estoque') return <StockView medicines={medicines} open={open} remove={(id: string) => remove(id, '/medicamentos', 'Medicamento')} searchRequest={searchRequest} />; if (page === 'pedidos') return <OrdersView orders={orders} open={open} onAdvance={advanceOrder} searchRequest={searchRequest} />; if (page === 'cadastros') return <CatalogView catalog={catalog} setCatalog={setCatalog} items={catalog === 'fornecedores' ? suppliers : units} suppliers={suppliers} units={units} open={open} remove={(id: string) => remove(id, catalog === 'fornecedores' ? '/fornecedores' : '/unidades-saude', 'Cadastro')} searchRequest={searchRequest} />; if (page === 'relatorios') return <ReportsView medicines={medicines} orders={orders} movements={movements} show={show} />; return <UsersAdminView users={users} roles={roles} open={open} remove={(id: string) => remove(id, '/usuarios', 'Usuário')} onToggleStatus={toggleUserStatus} privacyRequests={privacyRequests} onResolvePrivacyRequest={resolvePrivacyRequest} privacyTabFocus={privacyTabFocus} searchRequest={searchRequest} show={show} />; };
  const rememberPage = (target: Page) => { if (target !== page) pageHistory.current.push(page); };
  const selectGlobalSearchResult = (result: { page: Page; query: string; catalog?: 'fornecedores' | 'unidades' }) => { rememberPage(result.page); setSearchRequest({ ...result, token: Date.now() }); setPage(result.page); setGlobalSearchValue(''); };
  const navigatePage = (target: Page) => { rememberPage(target); setSearchRequest(null); setPage(target); };
  useEffect(() => {
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || !logged || modal || mobile || profileOpen || profileAnchor) return;
      const target = event.target;
      const activeElement = document.activeElement;
      const isTextEntry = (element: EventTarget | null) => element instanceof HTMLElement && (element.isContentEditable || Boolean(element.closest('input, textarea, select, [role="textbox"], [contenteditable="true"]')));
      const isGlobalSearch = (element: EventTarget | null) => element instanceof HTMLElement && Boolean(element.closest('.global-search'));
      if (globalSearchValue.trim() && (isGlobalSearch(target) || isGlobalSearch(activeElement))) { setGlobalSearchValue(''); event.preventDefault(); return; }
      if (isTextEntry(target) || isTextEntry(activeElement)) return;
      if (globalSearchValue.trim()) { setGlobalSearchValue(''); event.preventDefault(); return; }

      let previousPage: Page | undefined;
      while (pageHistory.current.length && !previousPage) {
        const candidate = pageHistory.current.pop();
        if (candidate && candidate !== page && canPage(candidate)) previousPage = candidate;
      }
      if (!previousPage) return;
      event.preventDefault();
      setSearchRequest(null);
      setPage(previousPage);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [logged, page, modal, mobile, profileOpen, profileAnchor, globalSearchValue, permissions, currentUser?.role]);
  const isAdministrator = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser?.role);
  const notificationItems = [
    ...medicines.flatMap((medicine: Medicine) => {
      const reasons: string[] = [];
      if (status(medicine) !== 'Regular') reasons.push(`Estoque ${status(medicine).toLowerCase()} · ${medicine.estoque.toLocaleString('pt-BR')} em estoque (mínimo ${medicine.minimo.toLocaleString('pt-BR')})`);
      const expiry = medicine.raw?.validade ? new Date(`${String(medicine.raw.validade).slice(0, 10)}T00:00:00Z`) : null;
      if (medicine.estoque > 0 && expiry && !Number.isNaN(expiry.getTime())) {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
        if (daysRemaining < 0) reasons.push(`Lote vencido há ${Math.abs(daysRemaining)} dia${Math.abs(daysRemaining) === 1 ? '' : 's'}`);
        else if (daysRemaining <= 30) reasons.push(daysRemaining === 0 ? 'Lote vence hoje' : `Lote vence em ${daysRemaining} dia${daysRemaining === 1 ? '' : 's'}`);
      }
      return reasons.length ? [{
        key: `medicine-${medicine.id}`,
        title: medicine.nome,
        detail: `${reasons.join(' · ')}${medicine.raw?.lote ? ` · Lote ${medicine.raw.lote}` : ''}.`,
        page: 'estoque' as Page,
        icon: <Inventory2 fontSize="small" />,
      }] : [];
    }),
    ...orders.filter((order: Order) => !['Entregue', 'Cancelado'].includes(order.status)).map((order: Order) => ({
      key: `order-${order.id}`,
      title: `Pedido #${order.id.slice(0, 8).toUpperCase()}`,
      detail: `${order.unidade} · ${order.medicamento} · ${order.status}`,
      page: 'pedidos' as Page,
      icon: <ShoppingCart fontSize="small" />,
    })),
    ...(canPage('usuarios') ? users.filter((user: User) => !user.status).map((user: User) => ({
      key: `user-${user.id}`,
      title: `Aprovar acesso: ${user.nome}`,
      detail: `${user.funcao || 'Função não definida'} · ${user.email}`,
      page: 'usuarios' as Page,
      icon: <Groups fontSize="small" />,
    })) : []),
    ...(isAdministrator ? privacyRequests.filter((request: any) => !['CONCLUIDA', 'RECUSADA'].includes(request.status)).map((request: any) => ({
      key: `privacy-${request.id}`,
      title: `Solicitação LGPD · ${request.usuario?.nome || 'Usuário'}`,
      detail: `${({ ACESSO: 'Acesso aos dados', CORRECAO: 'Correção de dados', ELIMINACAO: 'Eliminação de dados' } as Record<string, string>)[request.tipo] || request.tipo} · ${request.status === 'EM_ANALISE' ? 'Em análise' : 'Aguardando atendimento'}`,
      page: 'usuarios' as Page,
      tab: 'privacidade' as const,
      icon: <AdminPanelSettings fontSize="small" />,
    })) : []),
  ];
  const notificationCount = notificationItems.length;
  const unreadNotificationCount = notificationItems.reduce((count, item) => count + (seenNotificationKeys.has(item.key) ? 0 : 1), 0);
  if (!logged) return <ThemeProvider theme={theme}><CssBaseline /><AuthScreen onLogin={handleLogin} onRegister={handleRegister} /></ThemeProvider>;
  const initials = String(currentUser?.nome || 'U').split(' ').map((value: string) => value[0]).slice(0, 2).join('').toUpperCase();
  return <ThemeProvider theme={theme}><CssBaseline /><Box className="app-shell"><Sidebar page={page} setPage={navigatePage} mobile={mobile} setMobile={setMobile} onLogout={logout} permissions={permissions} role={currentUser?.role} currentUser={currentUser} onOpenProfile={(event: any) => { event.currentTarget.blur(); setProfileAnchor(event.currentTarget); }} /><Box className="workspace"><header className="topbar"><IconButton className="mobile-menu" onClick={() => setMobile(true)} aria-label="Abrir navegação"><Menu /></IconButton><GlobalSearch value={globalSearchValue} onChange={setGlobalSearchValue} medicines={medicines} orders={orders} suppliers={suppliers} units={units} users={users} canNavigate={canPage} onSelect={selectGlobalSearchResult} /><Stack direction="row" alignItems="center" spacing={1}><Box className="topbar-status"><span /> Rede ativa: Municipal</Box><IconButton aria-label={`Notificações: ${unreadNotificationCount} não lida${unreadNotificationCount === 1 ? '' : 's'}`} aria-haspopup="menu" aria-expanded={Boolean(notificationAnchor)} title="Ver notificações" onClick={event => { event.currentTarget.blur(); setSeenNotificationKeys(current => new Set([...current, ...notificationItems.map(item => item.key)])); setNotificationAnchor(event.currentTarget); }}><Badge badgeContent={unreadNotificationCount} color="error" max={99}><NotificationsNone /></Badge></IconButton></Stack></header><main className={page === 'dashboard' ? 'content content-dashboard' : 'content'}>{content()}</main></Box></Box><MuiMenu anchorEl={notificationAnchor?.isConnected ? notificationAnchor : null} open={Boolean(notificationAnchor?.isConnected)} onClose={() => setNotificationAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} PaperProps={{ className: 'notification-menu' }} MenuListProps={{ autoFocus: true, 'aria-label': 'Pendências e alertas' }}><Box className="notification-menu-header"><Typography fontWeight={800}>Pendências e alertas</Typography><Typography variant="body2" color="text.secondary">{notificationCount ? `${notificationCount} item${notificationCount === 1 ? '' : 's'} requer${notificationCount === 1 ? '' : 'em'} atenção` : 'Tudo em dia'}</Typography></Box><Divider />{notificationItems.length ? notificationItems.map(item => <MenuItem key={item.key} className="notification-menu-item" onClick={() => { setSeenNotificationKeys(current => new Set([...current, item.key])); setNotificationAnchor(null); if ('tab' in item && item.tab === 'privacidade') setPrivacyTabFocus(value => value + 1); navigatePage(item.page); }}><Box className="notification-menu-icon">{item.icon}</Box><Box className="notification-menu-copy"><Typography fontWeight={700}>{item.title}</Typography><Typography variant="body2" color="text.secondary">{item.detail}</Typography></Box></MenuItem>) : <Box className="notification-menu-empty"><CheckCircleOutline fontSize="small" /><Typography variant="body2">Nenhum alerta ou pedido pendente.</Typography></Box>}</MuiMenu><MuiMenu anchorEl={profileAnchor?.isConnected ? profileAnchor : null} open={Boolean(profileAnchor?.isConnected)} onClose={() => setProfileAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }} PaperProps={{ className: 'profile-menu' }} MenuListProps={{ autoFocus: true, 'aria-label': 'Menu do perfil' }}><Box className="profile-menu-header"><Avatar className="profile">{initials}</Avatar><Box><Typography fontWeight={800}>{currentUser?.nome || 'Usuário'}</Typography><Typography variant="body2" color="text.secondary">{roleLabels[currentUser?.role] || currentUser?.role || 'Usuário'}</Typography></Box></Box><Divider /><MenuItem onClick={() => { setProfileAnchor(null); setProfileOpen(true); }}>Meu perfil</MenuItem>{!isAdministrator && <MenuItem onClick={() => { setProfileAnchor(null); void requestPrivacyAction('CORRECAO'); }}>Solicitar correção</MenuItem>}<Divider /><MenuItem onClick={() => { setProfileAnchor(null); logout(); }}>Sair</MenuItem></MuiMenu><MyProfileDialog open={profileOpen} user={currentUser} onClose={() => setProfileOpen(false)} onProfileUpdated={setCurrentUser} /><AppDialog modal={modal} editing={editing} catalog={catalog} medicines={medicines} suppliers={suppliers} roles={roles} onClose={() => setModal(null)} onMedicine={saveMedicine} onOrder={saveOrder} onEntity={saveEntity} onUser={saveUser} onMovement={async (form: FormData) => { try { await api.patch(`/medicamentos/${editing.id}/estoque`, { quantidade: Number(form.get('quantidade')), tipo: String(form.get('tipo')) === 'Entrada' ? 'ENTRADA' : 'SAIDA', documentoReferencia: String(form.get('documentoReferencia')).trim(), observacao: String(form.get('observacao') || '').trim() }); await loadData(); setModal(null); show('Movimentação registrada.'); } catch (error: unknown) { show(getApiErrorMessage(error, 'Não foi possível registrar a movimentação.')); } }} /><Snackbar open={!!toast} autoHideDuration={3200} onClose={() => setToast('')}><Alert severity={toast.includes('não') || toast.includes('invál') ? 'error' : 'success'}>{toast}</Alert></Snackbar></ThemeProvider>;
}

function MyProfileDialog({ open, user, onClose, onProfileUpdated }: { open: boolean; user: any; onClose: () => void; onProfileUpdated: (user: any) => void }) {
  const [profile, setProfile] = useState(user || {});
  const [loading, setLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setProfile(user || {});
    setEditingProfile(false); setProfileMessage(''); setProfileError('');
    setLoading(true);
    api.get('/auth/me').then(({ data }) => {
      if (mounted && data?.usuario && typeof data.usuario === 'object') {
        setProfile({ ...data.usuario, cargo: data.usuario.cargo ?? user?.cargo ?? '' });
      }
    }).catch(() => undefined).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [open]);

  const changePassword = async (event: any) => {
    event.preventDefault();
    setPasswordError(''); setPasswordMessage('');
    if (newPassword.length < 10) { setPasswordError('A nova senha deve ter pelo menos 10 caracteres.'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('As senhas informadas não conferem.'); return; }
    setSavingPassword(true);
    try {
      const { data } = await api.patch('/auth/password', { senhaAtual: currentPassword, novaSenha: newPassword, confirmarSenha: confirmPassword });
      setPasswordMessage(data?.message || 'Senha alterada com sucesso.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (error: unknown) {
      setPasswordError(getApiErrorMessage(error, 'Não foi possível alterar a senha.'));
    } finally { setSavingPassword(false); }
  };

  // Cada usuário edita apenas o perfil vinculado à sessão atual; a API deriva o ID do cookie.
  const canEditProfile = Boolean(profile.id || user?.id);
  const saveProfile = async (event: any) => {
    event.preventDefault();
    setProfileError(''); setProfileMessage(''); setSavingProfile(true);
    try {
      const { data } = await api.patch('/auth/profile', {
        nome: profile.nome,
        email: profile.email,
        cpf: somenteNumeros(profile.cpf || ''),
        telefone: profile.telefone ? somenteNumeros(profile.telefone) : '',
        cargo: profile.cargo || '',
      });
      const updated = data?.usuario || data;
      setProfile(updated); onProfileUpdated(updated); setEditingProfile(false); setProfileMessage('Dados do perfil atualizados.');
    } catch (error: unknown) {
      setProfileError(getApiErrorMessage(error, 'Não foi possível atualizar o perfil.'));
    } finally { setSavingProfile(false); }
  };

  const maskedCpf = profile.cpf ? `***.***.${String(profile.cpf).replace(/\D/g, '').slice(-5, -2)}-**` : 'Não informado';
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="profile-dialog-title">
    <DialogTitle id="profile-dialog-title">Meu perfil</DialogTitle>
    <DialogContent className="my-profile-content">
      <Box className="my-profile-identity"><Avatar className="my-profile-avatar">{String(profile.nome || user?.nome || 'U').split(' ').map((part: string) => part[0]).slice(0, 2).join('').toUpperCase()}</Avatar><Box><Typography fontWeight={800}>{profile.nome || 'Usuário'}</Typography><Typography variant="body2" color="text.secondary">{roleLabels[profile.role] || profile.role || 'Perfil não informado'}</Typography></Box><Chip size="small" color={profile.ativo === false ? 'warning' : 'success'} label={profile.ativo === false ? 'Pendente' : 'Acesso ativo'} /></Box>
      {loading && <Typography variant="body2" color="text.secondary">Atualizando dados do perfil…</Typography>}
      {editingProfile && canEditProfile ? <Box component="form" className="admin-profile-form" onSubmit={saveProfile}>
        <TextField label="Nome completo" value={profile.nome || ''} onChange={event => setProfile((value: any) => ({ ...value, nome: event.target.value }))} required fullWidth />
        <TextField label="E-mail" type="email" value={profile.email || ''} onChange={event => setProfile((value: any) => ({ ...value, email: event.target.value }))} required fullWidth />
        <Box className="form-grid"><TextField label="CPF" value={profile.cpf ? formatarCpf(profile.cpf) : ''} onChange={event => setProfile((value: any) => ({ ...value, cpf: formatarCpf(event.target.value) }))} required fullWidth /><TextField label="Telefone" value={profile.telefone ? formatarTelefone(profile.telefone) : ''} onChange={event => setProfile((value: any) => ({ ...value, telefone: formatarTelefone(event.target.value) }))} fullWidth /></Box>
        <TextField label="Cargo / atribuição" value={profile.cargo ?? user?.cargo ?? ''} onChange={event => setProfile((value: any) => ({ ...value, cargo: event.target.value }))} fullWidth />
        {profileError && <Alert severity="error">{profileError}</Alert>}
        <Box className="profile-dialog-actions"><Button type="button" onClick={() => { setEditingProfile(false); setProfileError(''); }}>Cancelar</Button><Button type="submit" variant="contained" disabled={savingProfile}>{savingProfile ? 'Salvando…' : 'Salvar alterações'}</Button></Box>
      </Box> : <><Box className="my-profile-details"><ProfileDetail label="E-mail" value={profile.email} /><ProfileDetail label="CPF" value={maskedCpf} /><ProfileDetail label="Telefone" value={profile.telefone} /><ProfileDetail label="Cargo / atribuição" value={profile.cargo ?? user?.cargo} /><ProfileDetail label="Último acesso" value={profile.ultimoAcesso ? new Date(profile.ultimoAcesso).toLocaleString('pt-BR') : 'Disponível após novo acesso'} /></Box>
      {canEditProfile && <Button variant="outlined" size="small" onClick={() => { setProfileMessage(''); setEditingProfile(true); }}>Editar meus dados</Button>}</>}
      {profileMessage && <Alert severity="success">{profileMessage}</Alert>}
      <Divider className="profile-password-divider" />
      <Box component="form" onSubmit={changePassword} className="profile-password-form">
        <Box><Typography variant="h6">Segurança da conta</Typography><Typography variant="body2" color="text.secondary">Altere sua senha. Use pelo menos 10 caracteres.</Typography></Box>
        <TextField fullWidth label="Senha atual" type="password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} autoComplete="current-password" inputProps={{ maxLength: 72, 'aria-label': 'Senha atual' }} required />
        <Box className="form-grid"><TextField fullWidth label="Nova senha" type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} autoComplete="new-password" inputProps={{ minLength: 10, maxLength: 72, 'aria-label': 'Nova senha' }} required /><TextField fullWidth label="Confirmar nova senha" type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} autoComplete="new-password" inputProps={{ minLength: 10, maxLength: 72, 'aria-label': 'Confirmar nova senha' }} required /></Box>
        {passwordError && <Alert severity="error">{passwordError}</Alert>}{passwordMessage && <Alert severity="success">{passwordMessage}</Alert>}
        <Box className="profile-dialog-actions"><Button onClick={onClose}>Fechar</Button><Button type="submit" variant="contained" disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}>{savingPassword ? 'Salvando…' : 'Alterar senha'}</Button></Box>
      </Box>
    </DialogContent>
  </Dialog>;
}

function ProfileDetail({ label, value }: { label: string; value?: string | null }) { return <Box className="profile-detail"><Typography variant="caption">{label}</Typography><Typography variant="body2">{value || 'Não informado'}</Typography></Box>; }

function AuthScreen({ onLogin, onRegister }: { onLogin: (email: string, senha: string) => Promise<void>; onRegister: (payload: { nome: string; email: string; cpf: string; senha: string; telefone?: string; cargo?: string }) => Promise<any> }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ nome: '', email: '', cpf: '', senha: '', confirmarSenha: '', telefone: '', cargo: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const update = (field: keyof typeof form) => (event: any) => {
    const value = field === 'cpf' ? formatarCpf(event.target.value) : field === 'telefone' ? formatarTelefone(event.target.value) : event.target.value;
    setForm(current => ({ ...current, [field]: value }));
  };
  const changeMode = (next: 'login' | 'register') => { setMode(next); setError(''); setSuccess(''); };
  const submit = async () => {
    setSubmitting(true); setError('');
    try {
      if (mode === 'login') { await onLogin(form.email, form.senha); return; }
      if (!form.nome || !form.email || !form.cpf || !form.senha) { setError('Preencha nome, e-mail, CPF e senha.'); return; }
      if (!form.cargo) { setError('Selecione seu cargo ou atribuição.'); return; }
      if (form.senha.length < 10) { setError('A senha deve ter pelo menos 10 caracteres.'); return; }
      if (!cpfValido(form.cpf)) { setError('Informe um CPF válido.'); return; }
      if (form.telefone && !telefoneValido(form.telefone)) { setError('Informe um telefone brasileiro válido.'); return; }
      if (form.senha !== form.confirmarSenha) { setError('As senhas não conferem.'); return; }
      await onRegister({ nome: form.nome, email: form.email, cpf: somenteNumeros(form.cpf), senha: form.senha, telefone: form.telefone ? somenteNumeros(form.telefone) : undefined, cargo: form.cargo || undefined });
      setSuccess('Cadastro enviado. Aguarde a aprovação do administrador geral para entrar.');
      setForm(current => ({ ...current, senha: '', confirmarSenha: '' }));
    } catch (value: unknown) { setError(getApiErrorMessage(value, 'Não foi possível concluir o cadastro.')); }
    finally { setSubmitting(false); }
  };
  const passwordField = <TextField fullWidth label="Senha de acesso" value={form.senha} onChange={update('senha')} type={passwordVisible ? 'text' : 'password'} margin="normal" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} helperText={mode === 'register' ? 'Mínimo de 10 caracteres' : undefined} inputProps={{ minLength: mode === 'register' ? 10 : undefined, maxLength: 72 }} InputProps={{ endAdornment: <InputAdornment position="end"><IconButton aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setPasswordVisible(value => !value)} edge="end">{passwordVisible ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} onKeyDown={event => { if (event.key === 'Enter') void submit(); }} />;
  const confirmationField = <TextField fullWidth label="Confirmar senha" value={form.confirmarSenha} onChange={update('confirmarSenha')} type={confirmationVisible ? 'text' : 'password'} margin="normal" autoComplete="new-password" inputProps={{ minLength: 10, maxLength: 72 }} InputProps={{ endAdornment: <InputAdornment position="end"><IconButton aria-label={confirmationVisible ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'} onClick={() => setConfirmationVisible(value => !value)} edge="end">{confirmationVisible ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} onKeyDown={event => { if (event.key === 'Enter') void submit(); }} />;
  return <Box className="login"><Paper className="login-card"><Box className="login-copy">
    <Box className="logo"><img className="sam-full-logo" src="/sam-logo.svg" alt="S.A.M. — Assistência Farmacêutica Municipal" /></Box>
    <Typography className="login-kicker">PLATAFORMA DA REDE MUNICIPAL DE SAÚDE</Typography>
    <Typography variant="h3">Cada lote, cada dose, cada saída: rastreado.</Typography>
    <Typography className="login-intro">Estoque, pedidos entre unidades e movimentações em um só painel. Toda alteração fica registrada com o nome de quem fez.</Typography>
    <Box className="login-points">
      <span><b>01</b><span><strong>Saldo por lote e validade</strong><small>Alertas de reposição e de vencimento próximo.</small></span></span>
      <span><b>02</b><span><strong>Pedidos com fluxo de aprovação</strong><small>Da solicitação da unidade até a entrega.</small></span></span>
      <span><b>03</b><span><strong>Histórico que não se apaga</strong><small>Auditoria encadeada, com verificação de integridade.</small></span></span>
      <span><b>04</b><span><strong>Acesso por função</strong><small>Cada pessoa vê e faz apenas o que lhe cabe.</small></span></span>
    </Box>
    <Box className="login-security"><span><i /> ACESSO RESTRITO A SERVIDORES AUTORIZADOS</span><small>Os dados são tratados para a gestão da assistência farmacêutica, conforme a LGPD e as políticas municipais de privacidade.</small></Box>
  </Box><Box className="login-form">
    <Box className="auth-tabs"><Button className={mode === 'login' ? 'auth-tab-active' : ''} onClick={() => changeMode('login')}>Acessar S.A.M.</Button><Button className={mode === 'register' ? 'auth-tab-active' : ''} onClick={() => changeMode('register')}>Solicitar acesso</Button></Box>
    <Typography variant="h5" mt={3}>{mode === 'login' ? 'Acesse o sistema' : 'Solicite seu acesso institucional'}</Typography>
    <Typography color="text.secondary" mb={2}>{mode === 'login' ? 'Entre com seu e-mail institucional e senha para acessar a operação da rede.' : 'Após o envio, o administrador geral revisará suas credenciais para liberação institucional.'}</Typography>
    {mode === 'register' ? <><TextField fullWidth label="Nome completo" value={form.nome} onChange={update('nome')} margin="normal" autoComplete="name" /><TextField fullWidth label="E-mail" value={form.email} onChange={update('email')} margin="normal" type="email" autoComplete="email" /><Box className="form-grid"><TextField fullWidth label="CPF" value={form.cpf} onChange={update('cpf')} margin="normal" /><TextField fullWidth label="Telefone / Ramal" value={form.telefone} onChange={update('telefone')} margin="normal" /></Box><TextField fullWidth required select label="Cargo / Atribuição" value={form.cargo} onChange={update('cargo')} margin="normal"><MenuItem value="" disabled>Selecione seu cargo ou atribuição</MenuItem>{cargoOptions.map(option => <MenuItem key={option} value={option}>{option}</MenuItem>)}</TextField>{passwordField}{confirmationField}</> : <><TextField fullWidth label="E-mail" value={form.email} onChange={update('email')} margin="normal" type="email" autoComplete="username" />{passwordField}<Button className="forgot-password" onClick={() => setError('Solicite a redefinição de senha ao administrador geral da rede.')}>Esqueceu sua senha?</Button></>}
    {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}{success && <Alert severity="success" sx={{ mt: 1 }}>{success}</Alert>}
    <Button fullWidth size="large" variant="contained" startIcon={mode === 'login' ? <Login /> : <Add />} onClick={() => void submit()} disabled={submitting || (mode === 'login' ? !form.email || !form.senha : false)} sx={{ mt: 2 }}>{submitting ? 'Enviando…' : mode === 'login' ? 'Entrar' : 'Enviar solicitação de cadastro'}</Button>
    <Button fullWidth variant="text" className="auth-switch" onClick={() => changeMode(mode === 'login' ? 'register' : 'login')} sx={{ mt: 1 }}>{mode === 'login' ? 'Ainda não tenho acesso — criar cadastro' : 'Já tenho acesso — voltar para login'}</Button>
    <Typography className="auth-privacy">Ao continuar, você confirma que utiliza suas credenciais institucionais.</Typography>
  </Box></Paper><Typography className="login-footer">Departamento de Assistência Farmacêutica • Secretaria Municipal de Saúde</Typography></Box>;
}
function Sidebar({ page, setPage, mobile, setMobile, onLogout, onOpenProfile, permissions = [], role, currentUser }: any) {
  const pagePermission: Record<string, string | string[]> = { dashboard: 'dashboard.visualizar', estoque: 'estoque.visualizar', pedidos: 'pedidos.visualizar', cadastros: ['fornecedores.visualizar', 'unidades.visualizar'], relatorios: 'relatorios.visualizar', usuarios: 'usuarios.visualizar' };
  const can = (item: any) => { if (role === 'ADMIN' || role === 'SUPER_ADMIN') return true; const required = pagePermission[item.page]; return Array.isArray(required) ? required.some(permission => permissions.includes(permission)) : permissions.includes(required); };
  const initials = String(currentUser?.nome || 'U').split(' ').map((value: string) => value[0]).slice(0, 2).join('').toUpperCase();
  const inner = <><Box className="brand"><img className="sam-full-logo" src="/sam-logo.svg" alt="S.A.M. — Assistência Farmacêutica Municipal" /></Box><Box className="jurisdiction-card"><Typography>REDE ATIVA</Typography><strong>Municipal</strong></Box><Typography className="nav-caption">MENU PRINCIPAL</Typography><Box className="nav-list">{nav.filter(can).map(item => <Button disableTooltip key={item.page} aria-current={page === item.page ? 'page' : undefined} className={`nav-button ${page === item.page ? 'selected' : ''}`} startIcon={item.icon} onClick={() => { setPage(item.page); setMobile(false); }}>{item.label}</Button>)}</Box><Box className="sidebar-bottom"><Box className="sidebar-user"><IconButton disableTooltip className="sidebar-avatar-trigger" aria-label="Abrir menu do perfil" onClick={onOpenProfile}><Avatar>{initials}</Avatar></IconButton><Box><strong>{currentUser?.nome || 'Usuário'}</strong><span>{roleLabels[role] || role || 'Servidor municipal'}</span></Box></Box><Button disableTooltip className="nav-button logout-button" startIcon={<Logout />} onClick={onLogout}>Encerrar sessão</Button></Box></>;
  return <><aside className="sidebar">{inner}</aside><Drawer open={mobile} onClose={() => setMobile(false)}><Box className="drawer">{inner}</Box></Drawer></>;
}
function GlobalSearch({ value, onChange, medicines, orders, suppliers, units, users, canNavigate, onSelect }: any) {
  const query = value.trim().toLocaleLowerCase('pt-BR');
  const results = query ? [
    ...medicines.filter((item: Medicine) => `${item.nome} ${item.principioAtivo} ${item.raw?.lote || ''}`.toLocaleLowerCase('pt-BR').includes(query)).slice(0, 4).map((item: Medicine) => ({ page: 'estoque' as Page, query: value, title: item.nome, detail: `Estoque · lote ${item.raw?.lote || 'não informado'}`, key: `med-${item.id}` })),
    ...orders.filter((item: Order) => `${item.id} ${item.unidade} ${item.medicamento}`.toLocaleLowerCase('pt-BR').includes(query)).slice(0, 3).map((item: Order) => ({ page: 'pedidos' as Page, query: value, title: `Pedido #${item.id.slice(0, 8).toUpperCase()}`, detail: `${item.unidade} · ${item.medicamento}`, key: `ord-${item.id}` })),
    ...suppliers.filter((item: Entity) => `${item.nome} ${item.raw?.razaoSocial || ''} ${item.raw?.cnpj || ''}`.toLocaleLowerCase('pt-BR').includes(query)).slice(0, 2).map((item: Entity) => ({ page: 'cadastros' as Page, catalog: 'fornecedores' as const, query: value, title: item.raw?.razaoSocial || item.nome, detail: `Fornecedor · ${item.raw?.cnpj || 'CNPJ não informado'}`, key: `sup-${item.id}` })),
    ...units.filter((item: Entity) => `${item.nome} ${item.raw?.codigo || ''} ${item.raw?.cidade || ''}`.toLocaleLowerCase('pt-BR').includes(query)).slice(0, 2).map((item: Entity) => ({ page: 'cadastros' as Page, catalog: 'unidades' as const, query: value, title: item.nome, detail: `Unidade · ${item.raw?.codigo || item.raw?.tipo || 'Rede municipal'}`, key: `unit-${item.id}` })),
    ...users.filter((item: User) => `${item.nome} ${item.email}`.toLocaleLowerCase('pt-BR').includes(query)).slice(0, 2).map((item: User) => ({ page: 'usuarios' as Page, query: value, title: item.nome, detail: `Usuário · ${item.email}`, key: `user-${item.id}` })),
  ].filter((result: any) => canNavigate(result.page)).slice(0, 8) : [];
  const selectFirst = (event: KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter' && results[0]) { event.preventDefault(); onSelect(results[0]); } };
  return <Box className="global-search"><TextField size="small" fullWidth placeholder="Buscar medicamento, lote, pedido ou cadastro…" value={value} onChange={event => onChange(event.target.value)} onKeyDown={selectFirst} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} inputProps={{ 'aria-label': 'Buscar medicamento, lote, pedido ou cadastro', role: 'combobox', 'aria-expanded': Boolean(query), 'aria-controls': 'global-search-results' }} />{query && <Paper id="global-search-results" className="global-search-results" role="listbox">{results.length ? results.map((result: any) => <Box key={result.key} role="option" aria-selected="false" className="global-search-result" tabIndex={0} onMouseDown={event => event.preventDefault()} onClick={() => onSelect(result)} onKeyDown={event => { if (event.key === 'Enter') onSelect(result); }}><Box><Typography fontWeight={700}>{result.title}</Typography><Typography variant="body2" color="text.secondary">{result.detail}</Typography></Box><span>{result.page === 'estoque' ? 'Estoque' : result.page === 'pedidos' ? 'Pedidos' : result.page === 'cadastros' ? 'Cadastros' : 'Usuários'}</span></Box>) : <Box className="global-search-empty">Nenhum registro encontrado para “{value}”.</Box>}</Paper>}</Box>;
}
function Header({ eyebrow, title, children }: any) { return <Box className="page-header"><Box><Typography className="eyebrow">{eyebrow}</Typography><Typography variant="h4">{title}</Typography></Box>{children}</Box>; }
function StatusChip({ label }: { label: string }) { return <Chip size="small" label={label} className={`chip chip-${label.toLowerCase().replaceAll(' ', '-')}`} />; }
function Metric({ icon, label, value, change, amber, medicines = [], orders = [] }: any) { const [detailsOpen, setDetailsOpen] = useState(false); const interactive = ['Itens em estoque', 'Alertas ativos', 'Pedidos em aberto', 'Valor em estoque'].includes(label); const alerts = medicines.filter((medicine: Medicine) => status(medicine) !== 'Regular'); const openOrders = orders.filter((order: Order) => !['Entregue', 'Cancelado'].includes(order.status)); const handleKeyDown = (event: KeyboardEvent) => { if (interactive && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); setDetailsOpen(true); } }; return <><Paper className={`metric ${amber ? 'metric-warning' : 'metric-positive'} ${interactive ? 'metric-clickable' : ''}`} onClick={interactive ? () => setDetailsOpen(true) : undefined} onKeyDown={handleKeyDown} tabIndex={interactive ? 0 : undefined} role={interactive ? 'button' : undefined}><Box className="metric-icon">{icon}</Box><Typography color="text.secondary" variant="body2">{label}</Typography><Typography variant="h4">{value}</Typography>{change && <Typography className="metric-change">{change}</Typography>}</Paper><Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} fullWidth maxWidth="sm"><DialogTitle>{label === 'Alertas ativos' ? 'Alertas ativos de estoque' : label}</DialogTitle><DialogContent>{label === 'Alertas ativos' && (alerts.length === 0 ? <Typography color="text.secondary" sx={{ py: 3 }}>Não há alertas ativos no momento.</Typography> : <Stack spacing={1.5} sx={{ pt: 1 }}>{alerts.map((medicine: Medicine) => <Box className="alert-modal-row" key={medicine.id}><Box flex={1}><Typography fontWeight={800}>{medicine.nome}</Typography><Typography variant="body2" color="text.secondary">Estoque atual: {medicine.estoque} un. · mínimo: {medicine.minimo} un.</Typography></Box><StatusChip label={status(medicine)} /></Box>)}</Stack>)}{label === 'Itens em estoque' && <Stack spacing={1.5} sx={{ pt: 1 }}>{medicines.length === 0 ? <Typography color="text.secondary" sx={{ py: 3 }}>Nenhum medicamento disponível.</Typography> : medicines.map((medicine: Medicine) => <Box className="alert-modal-row" key={medicine.id}><Box flex={1}><Typography fontWeight={800}>{medicine.nome}</Typography><Typography variant="body2" color="text.secondary">{medicine.apresentacao}</Typography></Box><Typography fontWeight={800}>{medicine.estoque.toLocaleString('pt-BR')} un.</Typography></Box>)}</Stack>}{label === 'Pedidos em aberto' && <Stack spacing={1.5} sx={{ pt: 1 }}>{openOrders.length === 0 ? <Typography color="text.secondary" sx={{ py: 3 }}>Nenhum pedido em aberto.</Typography> : openOrders.map((order: Order) => <Box className="alert-modal-row" key={order.id}><Box flex={1}><Typography fontWeight={800}>{order.medicamento}</Typography><Typography variant="body2" color="text.secondary">{order.unidade} · {order.quantidade} un.</Typography></Box><StatusChip label={order.status} /></Box>)}</Stack>}{label === 'Valor em estoque' && <Stack spacing={1.5} sx={{ pt: 1 }}>{medicines.length === 0 ? <Typography color="text.secondary" sx={{ py: 3 }}>Nenhum medicamento disponível.</Typography> : medicines.map((medicine: Medicine) => <Box className="alert-modal-row" key={medicine.id}><Box flex={1}><Typography fontWeight={800}>{medicine.nome}</Typography><Typography variant="body2" color="text.secondary">{medicine.estoque.toLocaleString('pt-BR')} unidades</Typography></Box><Typography fontWeight={800}>{(medicine.estoque * medicine.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Typography></Box>)}</Stack>}</DialogContent><DialogActions><Button onClick={() => setDetailsOpen(false)}>Fechar</Button></DialogActions></Dialog></>; }
function DashboardView({ medicines, orders, currentUser, onGo }: any) {
  const low = medicines.filter((medicine: Medicine) => status(medicine) !== 'Regular');
  const expiring = medicines.filter((medicine: Medicine) => {
    const days = daysUntilExpiry(medicine.raw?.validade);
    return days !== null && days >= 0 && days <= 30;
  });
  const stockValue = medicines.reduce((sum: number, medicine: Medicine) => sum + medicine.estoque * medicine.preco, 0);
  const openOrders = orders.filter((order: Order) => !['Entregue', 'Cancelado'].includes(order.status));
  const stockItems = medicines.slice(0, 5);
  const activeAlerts = low.length + expiring.filter((medicine: Medicine) => !low.some((item: Medicine) => item.id === medicine.id)).length;

  return <Box className="dashboard-page">
    <Header eyebrow="PAINEL OPERACIONAL" title="Visão geral da rede">
      <Stack direction="row" spacing={1} className="dashboard-header-actions"><Button variant="contained" startIcon={<Add />} onClick={() => onGo('pedidos')}>Novo pedido</Button></Stack>
    </Header>
    <Typography className="dashboard-greeting-caption">Olá, {String(currentUser?.nome || 'servidor').split(' ')[0]}. Acompanhe a operação da rede municipal em tempo real.</Typography>
    <Box className="metric-grid">
      <Metric medicines={medicines} orders={orders} icon={<Inventory2 />} label="Itens em estoque" value={medicines.reduce((sum: number, medicine: Medicine) => sum + medicine.estoque, 0).toLocaleString('pt-BR')} change="Dados atuais" />
      <Metric medicines={medicines} orders={orders} icon={<WarningAmber />} label="Alertas ativos" value={activeAlerts} change="Estoque e validade" amber />
      <Metric medicines={medicines} orders={orders} icon={<ShoppingCart />} label="Pedidos em aberto" value={openOrders.length} change="Fluxo da rede" />
      <Metric medicines={medicines} orders={orders} icon={<TrendingUp />} label="Valor em estoque" value={stockValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} change="Valor estimado" />
    </Box>
    <Box className="dashboard-grid">
      <Paper className="panel dashboard-stock-panel">
        <Box className="panel-title">
          <Box><Typography variant="h6">Estoque por medicamento</Typography><Typography variant="body2" color="text.secondary">Saldos atuais e nível de reposição cadastrados</Typography></Box>
          <Button size="small" onClick={() => onGo('estoque')}>Ver estoque</Button>
        </Box>
        {stockItems.length ? <Box className="dashboard-stock-list">
          {stockItems.map((medicine: Medicine) => {
            const percent = medicine.maximo > 0 ? Math.max(0, Math.min(100, Math.round(medicine.estoque / medicine.maximo * 100))) : 0;
            const level = percent < 20 ? 'critical' : percent < 70 ? 'moderate' : 'normal';
            return <Box className="dashboard-stock-item" key={medicine.id}>
              <Box className="dashboard-stock-heading"><Typography fontWeight={700}>{medicine.nome}</Typography><Typography className="tabular-value">{medicine.estoque.toLocaleString('pt-BR')} / {medicine.maximo.toLocaleString('pt-BR')} un.</Typography></Box>
              <Box className="dashboard-stock-track" role="progressbar" aria-label={'Nível de estoque de ' + medicine.nome} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><span className={'dashboard-stock-fill ' + level} style={{ width: percent + '%' }} /></Box>
              <Typography className="dashboard-stock-percent">{percent}% da capacidade máxima</Typography>
            </Box>;
          })}
        </Box> : <Box className="chart-empty"><Inventory2 /><Typography fontWeight={700}>Ainda não há dados de estoque</Typography><Typography variant="body2">Cadastre medicamentos para visualizar os níveis da rede.</Typography><Button size="small" onClick={() => onGo('estoque')}>Abrir estoque</Button></Box>}
        <Box className="dashboard-legend"><span><i className="normal" /> Regular (&gt;70%)</span><span><i className="moderate" /> Atenção (20–70%)</span><span><i className="critical" /> Crítico (&lt;20%)</span></Box>
        <Typography className="dashboard-note">A cobertura em dias depende do histórico de consumo por medicamento.</Typography>
      </Paper>
      <Paper className="panel dashboard-alert-panel">
        <Box className="panel-title"><Box><Typography variant="h6">Alertas da rede</Typography><Typography variant="body2" color="text.secondary">Estoque abaixo do mínimo ou validade próxima</Typography></Box><Chip label={activeAlerts} size="small" color={activeAlerts ? 'warning' : 'success'} /></Box>
        {low.slice(0, 4).map((medicine: Medicine) => <Box className="alert-row" key={'stock-' + medicine.id}><Avatar className={status(medicine) === 'Crítico' ? 'red-avatar' : 'orange-avatar'}><WarningAmber /></Avatar><Box flex={1}><Typography fontWeight={700}>{medicine.nome}</Typography><Typography variant="body2" color="text.secondary">{status(medicine) === 'Crítico' ? 'Estoque crítico' : 'Abaixo do mínimo'} · {medicine.estoque.toLocaleString('pt-BR')} un. disponíveis · mínimo {medicine.minimo.toLocaleString('pt-BR')}</Typography></Box><StatusChip label={status(medicine)} /></Box>)}
        {expiring.filter((medicine: Medicine) => !low.some((item: Medicine) => item.id === medicine.id)).slice(0, 3).map((medicine: Medicine) => {
          const days = daysUntilExpiry(medicine.raw?.validade) ?? 0;
          return <Box className="alert-row" key={'expiry-' + medicine.id}><Avatar className="orange-avatar"><WarningAmber /></Avatar><Box flex={1}><Typography fontWeight={700}>{medicine.nome}</Typography><Typography variant="body2" color="text.secondary">Validade próxima · vence em {days} {days === 1 ? 'dia' : 'dias'} ({medicine.validade})</Typography></Box><StatusChip label="Atenção" /></Box>;
        })}
        {activeAlerts === 0 && <Box className="dashboard-empty-alert"><Typography fontWeight={700}>Nenhum alerta ativo</Typography><Typography variant="body2" color="text.secondary">Estoque e validade estão dentro dos limites cadastrados.</Typography></Box>}
        {(low.length > 4 || expiring.length > 3) && <Button size="small" className="dashboard-alert-action" onClick={() => onGo('estoque')}>Ver todos os alertas</Button>}
        {activeAlerts > 0 && <Button size="small" className="dashboard-alert-action" onClick={() => onGo('relatorios')}>Abrir relatórios</Button>}
      </Paper>
    </Box>
    <Paper className="panel dashboard-orders-panel">
      <Box className="panel-title"><Box><Typography variant="h6">Pedidos recentes</Typography><Typography variant="body2" color="text.secondary">Solicitações mais recentes das unidades da rede municipal</Typography></Box><Button size="small" onClick={() => onGo('pedidos')}>Ver todos</Button></Box>
      {orders.length ? <SimpleTable headings={['Unidade solicitante', 'Medicamento / item', 'Quantidade', 'Data', 'Status', 'Ações']} rows={orders.slice(0, 5).map((order: Order) => [<Box><Typography fontWeight={700}>{order.unidade}</Typography><Typography variant="body2" color="text.secondary">Unidade da rede municipal</Typography></Box>, order.medicamento, order.quantidade.toLocaleString('pt-BR') + ' un.', order.data, <StatusChip label={order.status} />, <Button size="small" onClick={() => onGo('pedidos')}>Detalhes</Button>])} /> : <Box className="dashboard-empty-orders"><ShoppingCart /><Box><Typography fontWeight={700}>Nenhum pedido registrado</Typography><Typography variant="body2" color="text.secondary">Os pedidos enviados pelas unidades aparecerão aqui.</Typography></Box><Button variant="outlined" onClick={() => onGo('pedidos')}>Abrir pedidos</Button></Box>}
      {orders.length > 5 && <Typography className="dashboard-table-caption">Mostrando 5 de {orders.length.toLocaleString('pt-BR')} pedidos registrados.</Typography>}
    </Paper>
    <Box className="dashboard-footer"><strong>S.A.M.</strong><span>Sistema Municipal de Assistência Farmacêutica</span><span>Indicadores calculados com os dados cadastrados nesta rede.</span></Box>
  </Box>;
}

function daysUntilExpiry(value?: string | Date | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const expiry = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const today = new Date();
  const startOfToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((expiry - startOfToday) / 86_400_000);
}
function StockView({ medicines, open, remove, searchRequest }: any) {
  const [query, setQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('Todos os níveis');
  const [supplierFilter, setSupplierFilter] = useState('Todos os fornecedores');
  useEffect(() => { if (searchRequest?.page === 'estoque') setQuery(searchRequest.query); }, [searchRequest]);
  const suppliers = [...new Map(medicines.filter((item: Medicine) => item.fornecedorId).map((item: Medicine) => [item.fornecedorId, item.fornecedor])).entries()];
  const list = medicines.filter((medicine: Medicine) => {
    const matchesQuery = `${medicine.nome} ${medicine.principioAtivo} ${medicine.apresentacao} ${medicine.raw?.lote || ''}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'));
    const matchesStatus = stockFilter === 'Todos os níveis' || status(medicine) === stockFilter;
    const matchesSupplier = supplierFilter === 'Todos os fornecedores' || medicine.fornecedorId === supplierFilter;
    return matchesQuery && matchesStatus && matchesSupplier;
  });
  const critical = medicines.filter((medicine: Medicine) => status(medicine) === 'Crítico').length;
  const attention = medicines.filter((medicine: Medicine) => status(medicine) === 'Baixo').length;
  const stockUnits = medicines.reduce((sum: number, medicine: Medicine) => sum + medicine.estoque, 0);
  const stockValue = medicines.reduce((sum: number, medicine: Medicine) => sum + medicine.estoque * medicine.preco, 0);
  const expiring = medicines.filter((medicine: Medicine) => { const days = medicine.raw?.validade ? Math.ceil((new Date(medicine.raw.validade).getTime() - Date.now()) / 86400000) : Infinity; return days >= 0 && days <= 90; }).length;
  return <>
    <Header eyebrow="GESTÃO DE INSUMOS" title="Estoque de medicamentos"><Button variant="contained" startIcon={<Add />} onClick={() => open('medicine')}>Adicionar medicamento</Button></Header>
    <Box className="stock-overview">
      <Paper className="stock-stat"><span>Itens cadastrados</span><strong>{medicines.length.toLocaleString('pt-BR')}</strong><small>Medicamentos na base operacional</small></Paper>
      <Paper className="stock-stat stock-stat-critical"><span>Estoque crítico</span><strong>{critical.toLocaleString('pt-BR')}</strong><small>Até metade do nível mínimo</small></Paper>
      <Paper className="stock-stat stock-stat-warning"><span>Abaixo do mínimo</span><strong>{attention.toLocaleString('pt-BR')}</strong><small>Reposição requer atenção</small></Paper>
      <Paper className="stock-stat"><span>Lotes a vencer</span><strong>{expiring.toLocaleString('pt-BR')}</strong><small>Validade nos próximos 90 dias</small></Paper>
    </Box>
    <Paper className="panel stock-table-panel">
      <Box className="panel-title"><Box><Typography variant="h6">Inventário da rede</Typography><Typography variant="body2" color="text.secondary">Saldos, lotes, validade e nível de reposição por medicamento</Typography></Box><Typography variant="body2" color="text.secondary">{list.length} de {medicines.length} itens · {stockUnits.toLocaleString('pt-BR')} unidades · {stockValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</Typography></Box>
      <Box className="toolbar stock-filters"><TextField size="small" placeholder="Buscar medicamento, princípio ativo ou lote..." value={query} onChange={event => setQuery(event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} /><Select size="small" value={stockFilter} onChange={event => setStockFilter(String(event.target.value))}>{['Todos os níveis', 'Crítico', 'Baixo', 'Regular'].map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select><Select size="small" value={supplierFilter} onChange={event => setSupplierFilter(String(event.target.value))}><MenuItem value="Todos os fornecedores">Todos os fornecedores</MenuItem>{suppliers.map(([id, name]: any) => <MenuItem key={id} value={id}>{name}</MenuItem>)}</Select></Box>
      {list.length ? <SimpleTable headings={['Medicamento / lote', 'Saldo atual', 'Nível de reposição', 'Validade', 'Fornecedor', 'Status', 'Ações']} rows={list.map((medicine: Medicine) => { const target = Math.max(medicine.maximo || 0, medicine.minimo || 0); const fill = target > 0 ? Math.min(100, Math.round(medicine.estoque / target * 100)) : 0; return [<Box><Typography fontWeight={700}>{medicine.nome}</Typography><Typography variant="body2" color="text.secondary">{medicine.apresentacao} · Lote {medicine.raw?.lote || 'não informado'}</Typography></Box>, <strong className="tabular-value">{medicine.estoque.toLocaleString('pt-BR')} un.</strong>, <Box className="stock-level-cell"><Box className="stock-level-track"><span style={{ width: `${fill}%` }} /></Box><Typography variant="caption">Mín. {medicine.minimo.toLocaleString('pt-BR')} · Máx. {target.toLocaleString('pt-BR')}</Typography></Box>, medicine.validade, medicine.fornecedor, <StatusChip label={status(medicine)} />, <Stack direction="row"><IconButton size="small" aria-label={`Registrar movimentação de ${medicine.nome}`} onClick={() => open('movement', medicine)}><SwapHoriz /></IconButton><IconButton size="small" aria-label={`Editar ${medicine.nome}`} onClick={() => open('medicine', medicine)}><EditOutlined /></IconButton><IconButton size="small" color="error" aria-label={`Remover ${medicine.nome}`} onClick={() => remove(medicine.id)}><DeleteOutline /></IconButton></Stack>]; })} /> : <Box className="catalog-empty"><Inventory2 /><Typography fontWeight={700}>{medicines.length ? 'Nenhum medicamento corresponde aos filtros' : 'Estoque ainda sem medicamentos'}</Typography><Typography variant="body2">{medicines.length ? 'Ajuste os filtros para consultar outros itens.' : 'Cadastre o primeiro item para iniciar o controle de estoque.'}</Typography>{!medicines.length && <Button size="small" onClick={() => open('medicine')}>Adicionar medicamento</Button>}</Box>}
      <Typography className="dashboard-note">Cobertura de estoque depende de histórico de consumo diário. Lote, validade e limites são exibidos conforme cadastrados.</Typography>
    </Paper>
  </>;
}
function OrdersView({ orders, open, onAdvance, searchRequest }: any) {
  const [filter, setFilter] = useState('Todos');
  const [query, setQuery] = useState('');
  useEffect(() => { if (searchRequest?.page === 'pedidos') setQuery(searchRequest.query); }, [searchRequest]);
  const pending = orders.filter((order: Order) => ['Pendente', 'Em análise'].includes(order.status)).length;
  const approved = orders.filter((order: Order) => order.status === 'Aprovado').length;
  const delivery = orders.filter((order: Order) => order.status === 'Em entrega').length;
  const completed = orders.filter((order: Order) => order.status === 'Entregue').length;
  const list = orders.filter((order: Order) => (filter === 'Todos' || order.status === filter) && `${order.id} ${order.unidade} ${order.medicamento} ${order.raw?.justificativa || ''}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  const tabs = ['Todos', 'Pendente', 'Em análise', 'Aprovado', 'Em entrega', 'Entregue', 'Cancelado'];
  return <>
    <Header eyebrow="REPOSIÇÃO E DISTRIBUIÇÃO" title="Pedidos da Rede Municipal"><Button variant="contained" startIcon={<Add />} onClick={() => open('order')}>Novo pedido</Button></Header>
    <Typography className="catalog-intro">Central de triagem, aprovação e acompanhamento das requisições das unidades municipais de saúde.</Typography>
    <Box className="order-overview"><Paper className="order-stat order-stat-warning"><span>Em triagem</span><strong>{pending.toLocaleString('pt-BR')}</strong><small>Pendentes ou em análise</small></Paper><Paper className="order-stat"><span>Aprovados</span><strong>{approved.toLocaleString('pt-BR')}</strong><small>Aguardando expedição</small></Paper><Paper className="order-stat"><span>Em distribuição</span><strong>{delivery.toLocaleString('pt-BR')}</strong><small>Pedidos em entrega</small></Paper><Paper className="order-stat"><span>Concluídos</span><strong>{completed.toLocaleString('pt-BR')}</strong><small>Entregas confirmadas</small></Paper></Box>
    <Paper className="panel orders-table-panel"><Box className="panel-title"><Box><Typography variant="h6">Fila de pedidos</Typography><Typography variant="body2" color="text.secondary">Triagem e acompanhamento das solicitações registradas pelas unidades</Typography></Box><Chip label={`${list.length} registros`} size="small" variant="outlined" /></Box>
      <Box className="tabs order-status-tabs">{tabs.map(value => <Button key={value} className={filter === value ? 'tab-selected' : ''} onClick={() => setFilter(value)}>{value}<span className="tab-count">{value === 'Todos' ? orders.length : orders.filter((order: Order) => order.status === value).length}</span></Button>)}</Box>
      <Box className="toolbar"><TextField size="small" placeholder="Buscar unidade ou medicamento..." value={query} onChange={event => setQuery(event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} /><Typography variant="body2" color="text.secondary">Aprovação e confirmação da entrega são registradas no sistema.</Typography></Box>
      {list.length ? <SimpleTable headings={['Nº do pedido', 'Unidade solicitante', 'Insumo solicitado', 'Quantidade', 'Previsão de entrega', 'Solicitado em', 'Status / ação']} rows={list.map((order: Order) => [<Box><Typography fontWeight={700}>#{order.id.slice(0, 8).toUpperCase()}</Typography><Typography variant="body2" color="text.secondary">{order.raw?.justificativa || 'Solicitação da rede'}</Typography></Box>, <Box><Typography fontWeight={700}>{order.unidade}</Typography><Typography variant="body2" color="text.secondary">{order.raw?.solicitante?.codigo || order.raw?.solicitante?.tipo || 'Unidade municipal'}</Typography></Box>, order.medicamento, <strong className="tabular-value">{order.quantidade.toLocaleString('pt-BR')} un.</strong>, formatDate(order.raw?.dataPrevistaEntrega), order.data, <Button size="small" disabled={['Em análise', 'Entregue', 'Cancelado'].includes(order.status)} onClick={() => onAdvance(order)}><StatusChip label={order.status} /></Button>])} /> : <Box className="catalog-empty"><ShoppingCart /><Typography fontWeight={700}>{orders.length ? 'Nenhum pedido corresponde aos filtros' : 'Nenhum pedido registrado'}</Typography><Typography variant="body2">{orders.length ? 'Tente outra situação ou termo de busca.' : 'As solicitações feitas pelas unidades aparecerão nesta fila.'}</Typography>{!orders.length && <Button size="small" onClick={() => open('order')}>Criar pedido</Button>}</Box>}
    </Paper>
    <Box className="orders-support-grid">
      <Paper className="panel orders-support-card orders-distribution-card">
        <Box className="panel-title"><Box><Typography variant="h6">Fluxo de distribuição da rede</Typography><Typography variant="body2" color="text.secondary">Acompanhamento baseado nos pedidos registrados</Typography></Box><Chip size="small" label={`${delivery} em entrega`} color={delivery ? 'info' : 'default'} /></Box>
        {orders.length ? <Stack spacing={1}>{orders.filter((order: Order) => !['Entregue', 'Cancelado'].includes(order.status)).slice(0, 3).map((order: Order) => <Box className="dispatch-row" key={order.id}><Box className="dispatch-mark"><ShoppingCart /></Box><Box minWidth={0} flex={1}><Typography className="dispatch-unit" fontWeight={700}>{order.unidade}</Typography><Typography className="dispatch-details" variant="body2" color="text.secondary">#{order.id.slice(0, 8).toUpperCase()} · {order.medicamento} · {order.quantidade.toLocaleString('pt-BR')} un.</Typography></Box><StatusChip label={order.status} /></Box>)}</Stack> : <Box className="chart-empty"><ShoppingCart /><Typography fontWeight={700}>Sem pedidos para distribuir</Typography><Typography variant="body2">Os pedidos em aberto serão listados neste painel.</Typography></Box>}
        <Typography className="dashboard-note">Rastreamento de veículos e emissão de romaneios ainda não estão integrados.</Typography>
      </Paper>
      <Paper className="panel orders-support-card orders-compliance-card"><Typography className="eyebrow">RASTREABILIDADE OPERACIONAL</Typography><Typography variant="h6">Histórico e conformidade</Typography><Typography variant="body2" color="text.secondary">As mudanças de status dos pedidos são registradas na trilha de auditoria do sistema.</Typography><Box className="compliance-facts"><Box><span>Pedidos registrados</span><strong>{orders.length.toLocaleString('pt-BR')}</strong></Box><Box><span>Entregas confirmadas</span><strong>{completed.toLocaleString('pt-BR')}</strong></Box></Box><Typography className="dashboard-note">Certificação de cadeia fria e assinatura digital ainda não estão integradas.</Typography></Paper>
    </Box>
  </>;
}
function CatalogView({ catalog, setCatalog, items, suppliers, units, open, remove, searchRequest }: any) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos os status');
  useEffect(() => { if (searchRequest?.page === 'cadastros') { if (searchRequest.catalog) setCatalog(searchRequest.catalog); setQuery(searchRequest.query); } }, [searchRequest, setCatalog]);
  const label = catalog === 'fornecedores' ? 'Fornecedores farmacêuticos' : 'Unidades de saúde';
  const filtered = items.filter((item: Entity) => {
    const matchesQuery = `${item.nome} ${item.detalhe} ${item.raw?.cnpj || ''} ${item.raw?.codigo || ''} ${item.raw?.email || ''}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'));
    return matchesQuery && (statusFilter === 'Todos os status' || (statusFilter === 'Ativos' ? item.status : !item.status));
  });
  const activeSuppliers = suppliers.filter((item: Entity) => item.status).length;
  const activeUnits = units.filter((item: Entity) => item.status).length;
  const suppliersWithLeadTime = suppliers.filter((item: Entity) => Number(item.raw?.prazoEntrega) > 0);
  const averageLeadTime = suppliersWithLeadTime.length ? Math.round(suppliersWithLeadTime.reduce((sum: number, item: Entity) => sum + Number(item.raw?.prazoEntrega), 0) / suppliersWithLeadTime.length) : null;
  const incomplete = [...suppliers.filter((item: Entity) => !item.raw?.cnpj), ...units.filter((item: Entity) => !item.raw?.codigo)].length;
  return <>
    <Header eyebrow="BASE CADASTRAL · SUPRIMENTOS E REDE" title="Fornecedores & Unidades de Saúde"><Button variant="contained" startIcon={<Add />} onClick={() => open('entity')}>Adicionar {catalog === 'fornecedores' ? 'fornecedor' : 'unidade'}</Button></Header>
    <Typography className="catalog-intro">Gestão dos fornecedores farmacêuticos e das unidades municipais vinculadas à rede de assistência.</Typography>
    <Box className="catalog-overview catalog-overview-four">
      <Paper className="catalog-stat"><span>Fornecedores ativos</span><strong>{activeSuppliers.toLocaleString('pt-BR')}</strong><small>de {suppliers.length} cadastrados</small></Paper>
      <Paper className="catalog-stat"><span>Unidades ativas</span><strong>{activeUnits.toLocaleString('pt-BR')}</strong><small>UBSs, UPAs e hospitais</small></Paper>
      <Paper className="catalog-stat"><span>Prazo médio informado</span><strong>{averageLeadTime === null ? '—' : `${averageLeadTime} dias`}</strong><small>Conforme cadastro dos fornecedores</small></Paper>
      <Paper className="catalog-stat catalog-stat-attention"><span>Identificação incompleta</span><strong>{incomplete.toLocaleString('pt-BR')}</strong><small>Sem CNPJ ou código cadastrado</small></Paper>
    </Box>
    <Paper className="panel catalog-panel">
      <Box className="tabs"><Button className={catalog === 'fornecedores' ? 'tab-selected' : ''} onClick={() => { setCatalog('fornecedores'); setQuery(''); setStatusFilter('Todos os status'); }}>Fornecedores farmacêuticos <span className="tab-count">{suppliers.length}</span></Button><Button className={catalog === 'unidades' ? 'tab-selected' : ''} onClick={() => { setCatalog('unidades'); setQuery(''); setStatusFilter('Todos os status'); }}>Unidades de saúde / UBS / UPAs <span className="tab-count">{units.length}</span></Button></Box>
      <Box className="panel-title"><Box><Typography variant="h6">{label}</Typography><Typography variant="body2" color="text.secondary">Registros mantidos pela gestão municipal · {filtered.length} exibidos</Typography></Box></Box>
      <Box className="toolbar catalog-filters"><TextField size="small" placeholder={catalog === 'fornecedores' ? 'Buscar por razão social, CNPJ ou contato...' : 'Buscar unidade, código ou localização...'} value={query} onChange={event => setQuery(event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} /><Select size="small" value={statusFilter} onChange={event => setStatusFilter(String(event.target.value))}>{['Todos os status', 'Ativos', 'Inativos'].map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></Box>
      {filtered.length ? <SimpleTable headings={catalog === 'fornecedores' ? ['Fornecedor / razão social', 'Identificação e contato', 'Prazo médio', 'Status cadastral', 'Ações'] : ['Unidade de saúde', 'Tipo / código', 'Localização e contato', 'Responsável', 'Status cadastral', 'Ações']} rows={filtered.map((item: Entity) => catalog === 'fornecedores' ? [<Box><Typography fontWeight={700}>{item.raw?.razaoSocial || item.nome}</Typography>{item.raw?.razaoSocial && <Typography variant="body2" color="text.secondary">{item.nome}</Typography>}</Box>, <Box><Typography>{item.raw?.cnpj ? `CNPJ ${item.raw.cnpj}` : 'CNPJ não informado'}</Typography><Typography variant="body2" color="text.secondary">{item.raw?.email || item.raw?.telefone || item.detalhe}</Typography></Box>, item.raw?.prazoEntrega ? `${item.raw.prazoEntrega} dias` : '—', <Chip label={item.status ? 'Ativo' : 'Inativo'} color={item.status ? 'success' : 'default'} size="small" />, <Stack direction="row"><IconButton size="small" title="Editar fornecedor" aria-label={`Editar ${item.nome}`} onClick={() => open('entity', item)}><EditOutlined /></IconButton><IconButton size="small" title="Remover fornecedor" aria-label={`Remover ${item.nome}`} color="error" onClick={() => remove(item.id)}><DeleteOutline /></IconButton></Stack>] : [<Box><Typography fontWeight={700}>{item.nome}</Typography><Typography variant="body2" color="text.secondary">{item.raw?.codigo || 'Código não informado'}</Typography></Box>, item.raw?.tipo || '—', <Box><Typography>{[item.raw?.cidade, item.raw?.uf].filter(Boolean).join(' / ') || 'Localização não informada'}</Typography><Typography variant="body2" color="text.secondary">{item.raw?.telefone || item.raw?.email || 'Contato não informado'}</Typography></Box>, item.raw?.responsavel || '—', <Chip label={item.status ? 'Ativa' : 'Inativa'} color={item.status ? 'success' : 'default'} size="small" />, <Stack direction="row"><IconButton size="small" title="Editar unidade" aria-label={`Editar ${item.nome}`} onClick={() => open('entity', item)}><EditOutlined /></IconButton><IconButton size="small" title="Remover unidade" aria-label={`Remover ${item.nome}`} color="error" onClick={() => remove(item.id)}><DeleteOutline /></IconButton></Stack>])} /> : <Box className="catalog-empty"><Apartment /><Typography fontWeight={700}>{query || statusFilter !== 'Todos os status' ? 'Nenhum cadastro corresponde aos filtros' : `Nenhum ${catalog === 'fornecedores' ? 'fornecedor' : 'unidade'} cadastrado`}</Typography><Typography variant="body2">{query || statusFilter !== 'Todos os status' ? 'Ajuste os filtros para consultar outros registros.' : 'Adicione um cadastro para iniciar a organização da rede.'}</Typography>{!query && statusFilter === 'Todos os status' && <Button size="small" onClick={() => open('entity')}>Adicionar {catalog === 'fornecedores' ? 'fornecedor' : 'unidade'}</Button>}</Box>}
      {catalog === 'fornecedores' && <Box className="catalog-note"><Typography fontWeight={700}>Rastreabilidade cadastral</Typography><Typography variant="body2">CNPJ, contato e prazo de entrega são exibidos conforme informados. AFE, contratos e validações regulatórias dependem de integração ainda não disponível.</Typography></Box>}
    </Paper>
    <Box className="catalog-support-grid">
      <Paper className="panel catalog-support-card"><Typography className="eyebrow">IDENTIFICAÇÃO CADASTRAL</Typography><Typography variant="h6">Documentação dos fornecedores</Typography><Typography variant="body2" color="text.secondary">CNPJ informado em {suppliers.filter((item: Entity) => Boolean(item.raw?.cnpj)).length} de {suppliers.length} cadastros.</Typography><LinearProgress variant="determinate" value={suppliers.length ? suppliers.filter((item: Entity) => Boolean(item.raw?.cnpj)).length / suppliers.length * 100 : 0} /><Typography className="dashboard-note">AFE, CNES e situação sanitária aguardam uma fonte de validação.</Typography></Paper>
      <Paper className="panel catalog-support-card"><Typography className="eyebrow">CONTRATOS E REGULAÇÃO</Typography><Typography variant="h6">Rastreabilidade regulatória</Typography><Typography variant="body2" color="text.secondary">A plataforma ainda não recebe contratos, atas de registro de preço ou bases ANVISA/CNES.</Typography><Chip size="small" variant="outlined" label="Integração não configurada" /></Paper>
      <Paper className="panel catalog-support-card"><Typography className="eyebrow">REDE MUNICIPAL</Typography><Typography variant="h6">Unidades de saúde</Typography><Box className="compliance-facts"><Box><span>Unidades ativas</span><strong>{activeUnits.toLocaleString('pt-BR')}</strong></Box><Box><span>Total cadastradas</span><strong>{units.length.toLocaleString('pt-BR')}</strong></Box></Box><Typography className="dashboard-note">A cobertura corresponde aos registros cadastrados nesta rede.</Typography></Paper>
    </Box>
  </>;
}
function ReportsView({ medicines, orders, movements, show }: any) {
  const [period, setPeriod] = useState('Últimos 30 dias');
  const [exporting, setExporting] = useState(false);
  const days = period === 'Últimos 30 dias' ? 30 : period === 'Último trimestre' ? 90 : 365;
  const cutoff = new Date(); if (period === 'Este ano') cutoff.setMonth(0, 1); else cutoff.setDate(cutoff.getDate() - days); cutoff.setHours(0, 0, 0, 0);
  const periodMovements = movements.filter((item: any) => new Date(item.data || item.createdAt) >= cutoff);
  const periodOrders = orders.filter((item: Order) => new Date(item.raw?.dataSolicitacao || item.raw?.createdAt) >= cutoff);
  const movementTotal = periodMovements.reduce((sum: number, item: any) => sum + Number(item.quantidade || 0), 0);
  const outgoing = periodMovements.filter((item: any) => ['SAIDA', 'DISPENSA'].includes(item.tipo)).reduce((sum: number, item: any) => sum + Number(item.quantidade || 0), 0);
  const entries = periodMovements.filter((item: any) => item.tipo === 'ENTRADA').reduce((sum: number, item: any) => sum + Number(item.quantidade || 0), 0);
  const chart = Array.from({ length: 6 }, (_, index) => {
    const start = new Date(cutoff.getTime() + (days * index / 6) * 86400000);
    const end = new Date(cutoff.getTime() + (days * (index + 1) / 6) * 86400000);
    const inBucket = periodMovements.filter((item: any) => { const date = new Date(item.data || item.createdAt); return date >= start && date < end; });
    return { periodo: start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), entradas: inBucket.filter((item: any) => item.tipo === 'ENTRADA').reduce((sum: number, item: any) => sum + Number(item.quantidade || 0), 0), saidas: inBucket.filter((item: any) => ['SAIDA', 'DISPENSA'].includes(item.tipo)).reduce((sum: number, item: any) => sum + Number(item.quantidade || 0), 0) };
  });
  const mostMoved = [...periodMovements.reduce((map: Map<string, any>, item: any) => { const name = item.medicamento?.nome || item.medicamentoNome || 'Medicamento'; const current = map.get(name) || { nome: name, quantidade: 0 }; current.quantidade += Number(item.quantidade || 0); map.set(name, current); return map; }, new Map()).values()].sort((a: any, b: any) => b.quantidade - a.quantidade).slice(0, 5);
  const exportReport = async (formato: 'PDF' | 'EXCEL', visualizar = false) => { setExporting(true); const preview = visualizar ? window.open('', '_blank') : null; try { const dataFim = new Date(); const dataInicio = new Date(dataFim); if (period === 'Últimos 30 dias') dataInicio.setDate(dataInicio.getDate() - 30); else if (period === 'Último trimestre') dataInicio.setDate(dataInicio.getDate() - 90); else dataInicio.setMonth(0, 1); dataInicio.setHours(0, 0, 0, 0); const response = await api.post('/relatorios/exportar', { tipo: 'MEDICAMENTOS', formato, dataInicio: dataInicio.toISOString(), dataFim: dataFim.toISOString() }, { responseType: 'blob' }); const url = URL.createObjectURL(response.data); if (visualizar && preview) { preview.location.href = url; show('PDF aberto para visualização.'); setTimeout(() => URL.revokeObjectURL(url), 60000); } else { const link = document.createElement('a'); link.href = url; link.download = `relatorio-sam.${formato === 'PDF' ? 'pdf' : 'xlsx'}`; link.click(); URL.revokeObjectURL(url); show('Relatório exportado.'); } } catch (error: unknown) { preview?.close(); show(getApiErrorMessage(error, 'Não foi possível gerar o relatório.')); } finally { setExporting(false); } };
  return <>
    <Header eyebrow="INTELIGÊNCIA OPERACIONAL" title="Relatórios e análises"><Select size="small" value={period} onChange={event => setPeriod(String(event.target.value))}>{['Últimos 30 dias', 'Último trimestre', 'Este ano'].map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></Header>
    <Box className="report-grid"><Paper className="panel report-summary"><Typography variant="h6">Resumo do período</Typography><Typography variant="body2" color="text.secondary">Movimentações registradas entre {cutoff.toLocaleDateString('pt-BR')} e hoje</Typography><Box className="report-number">{movementTotal.toLocaleString('pt-BR')}<small> unidades movimentadas</small></Box><Divider /><Stack spacing={1.2} mt={2}><Typography>Entradas recebidas <b>{entries.toLocaleString('pt-BR')} un.</b></Typography><Typography>Saídas e dispensações <b>{outgoing.toLocaleString('pt-BR')} un.</b></Typography><Typography>Pedidos criados <b>{periodOrders.length.toLocaleString('pt-BR')}</b></Typography></Stack></Paper>
      <Paper className="panel"><Typography variant="h6">Relatório de inventário</Typography><Typography color="text.secondary" variant="body2" my={2}>Exportação oficial de medicamentos gerada pelo backend. Período selecionado acima.</Typography><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap"><Button variant="outlined" startIcon={<Visibility />} disabled={exporting} onClick={() => exportReport('PDF', true)}>Visualizar PDF</Button><Button variant="outlined" disabled={exporting} onClick={() => exportReport('PDF')}>Exportar PDF</Button><Button variant="outlined" disabled={exporting} onClick={() => exportReport('EXCEL')}>Exportar Excel</Button></Stack></Paper></Box>
    <Box className="report-kpi-grid"><Paper className="report-kpi"><span>Disponibilidade da base</span><strong>{medicines.length ? `${Math.round(medicines.filter((medicine: Medicine) => status(medicine) === 'Regular').length / medicines.length * 100)}%` : '—'}</strong><small>Medicamentos acima do mínimo</small></Paper><Paper className="report-kpi"><span>Pedidos concluídos</span><strong>{periodOrders.length ? `${Math.round(periodOrders.filter((order: Order) => order.status === 'Entregue').length / periodOrders.length * 100)}%` : '—'}</strong><small>Entregues entre os pedidos do período</small></Paper><Paper className="report-kpi report-kpi-danger"><span>Itens em nível crítico</span><strong>{medicines.filter((medicine: Medicine) => status(medicine) === 'Crítico').length.toLocaleString('pt-BR')}</strong><small>Estoque atual até metade do mínimo</small></Paper><Paper className="report-kpi"><span>Movimentações registradas</span><strong>{periodMovements.length.toLocaleString('pt-BR')}</strong><small>{movementTotal.toLocaleString('pt-BR')} unidades no período</small></Paper></Box>
    <Box className="report-grid report-analysis-grid"><Paper className="panel"><Box className="panel-title"><Box><Typography variant="h6">Fluxo de estoque</Typography><Typography variant="body2" color="text.secondary">Quantidades das movimentações registradas no período</Typography></Box></Box>{periodMovements.length ? <Box className="report-chart"><ResponsiveContainer width="100%" height={300}><BarChart data={chart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="periodo" /><YAxis /><Tooltip /><Bar dataKey="entradas" name="Entradas" fill="#2fbf8f" radius={[6, 6, 0, 0]} /><Bar dataKey="saidas" name="Saídas e dispensações" fill="#1d5fd1" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></Box> : <Box className="chart-empty"><TrendingUp /><Typography fontWeight={700}>Sem movimentações no período</Typography><Typography variant="body2">Quando houver entradas, saídas ou dispensações registradas, a série aparecerá aqui.</Typography></Box>}</Paper>
      <Paper className="panel"><Box className="panel-title"><Box><Typography variant="h6">Medicamentos com maior movimentação</Typography><Typography variant="body2" color="text.secondary">Soma de entradas, saídas e dispensações no período</Typography></Box></Box>{mostMoved.length ? <Stack spacing={1.6} className="top-moved-list">{mostMoved.map((item: any, index: number) => <Box className="top-moved-row" key={item.nome}><span>{String(index + 1).padStart(2, '0')}</span><Typography>{item.nome}</Typography><strong>{item.quantidade.toLocaleString('pt-BR')} un.</strong></Box>)}</Stack> : <Box className="chart-empty"><Inventory2 /><Typography fontWeight={700}>Sem dados de consumo</Typography><Typography variant="body2">O ranking depende dos registros de movimentação.</Typography></Box>}<Typography className="dashboard-note">Curva ABC, consumo epidemiológico e relatórios regulatórios dependem de dados e modelos ainda não disponíveis nesta base.</Typography></Paper></Box>
    <Paper className="panel report-history-panel"><Box className="panel-title"><Box><Typography variant="h6">Movimentações recentes</Typography><Typography variant="body2" color="text.secondary">Registros de estoque no período selecionado</Typography></Box><Chip label={`${periodMovements.length} registros`} size="small" variant="outlined" /></Box>{periodMovements.length ? <SimpleTable headings={['Data e hora', 'Medicamento', 'Tipo de movimentação', 'Quantidade', 'Responsável']} rows={periodMovements.slice(0, 8).map((item: any) => [new Date(item.data || item.createdAt).toLocaleString('pt-BR'), item.medicamento?.nome || item.medicamentoNome || 'Medicamento', item.tipo === 'ENTRADA' ? 'Entrada' : item.tipo === 'SAIDA' ? 'Saída' : 'Dispensação', <strong className="tabular-value">{Number(item.quantidade || 0).toLocaleString('pt-BR')} un.</strong>, item.responsavel?.nome || item.responsavelNome || '—'])} /> : <Box className="chart-empty"><Typography fontWeight={700}>Sem movimentações registradas neste período</Typography><Typography variant="body2">Os registros aparecerão aqui conforme entradas, saídas e dispensações forem realizadas.</Typography></Box>}</Paper>
  </>;
}
function Insight({ label, value }: any) { return <Box><Typography className="eyebrow">{label}</Typography><Typography variant="h4">{value}</Typography></Box>; }
function LocationFields({ city, uf }: { city?: string; uf?: string }) {
  const [selectedUf, setSelectedUf] = useState((uf || '').toUpperCase());
  const [selectedCity, setSelectedCity] = useState(city || '');
  const [municipalities, setMunicipalities] = useState<string[]>(city ? [city] : []);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [municipalityLoadFailed, setMunicipalityLoadFailed] = useState(false);

  useEffect(() => {
    setSelectedUf((uf || '').toUpperCase());
    setSelectedCity(city || '');
  }, [city, uf]);

  useEffect(() => {
    if (!selectedUf) {
      setMunicipalities(selectedCity ? [selectedCity] : []);
      setMunicipalityLoadFailed(false);
      return;
    }
    const controller = new AbortController();
    setLoadingMunicipalities(true);
    setMunicipalityLoadFailed(false);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios?orderBy=nome`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Falha ao consultar municípios');
        return response.json();
      })
      .then((items: Array<{ nome: string }>) => {
        const names = items.map(item => item.nome);
        if (selectedCity && !names.includes(selectedCity)) names.unshift(selectedCity);
        setMunicipalities(names);
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          setMunicipalities(selectedCity ? [selectedCity] : []);
          setMunicipalityLoadFailed(true);
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoadingMunicipalities(false); });
    return () => controller.abort();
  }, [selectedUf, city]);

  return <Box className="form-grid">
    <TextField select name="uf" label="UF" value={selectedUf} onChange={event => { setSelectedUf(event.target.value); setSelectedCity(''); }} fullWidth margin="dense">
      <MenuItem value=""><em>Selecione uma UF</em></MenuItem>
      {brazilianStates.map(([code, name]) => <MenuItem key={code} value={code}>{code} — {name}</MenuItem>)}
    </TextField>
    <TextField select name="cidade" label="Cidade" value={selectedCity} onChange={event => setSelectedCity(event.target.value)} fullWidth margin="dense" disabled={!selectedUf || loadingMunicipalities} helperText={municipalityLoadFailed ? 'Não foi possível carregar a lista oficial. Verifique a conexão e tente novamente.' : undefined}>
      <MenuItem value=""><em>{!selectedUf ? 'Selecione primeiro a UF' : loadingMunicipalities ? 'Carregando municípios…' : 'Selecione uma cidade'}</em></MenuItem>
      {municipalities.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
    </TextField>
  </Box>;
}
function UsersView({ users, roles, open, remove, onToggleStatus }: any) { const pending = users.filter((user: User) => !user.status).length; return <><Header eyebrow="ACESSO E GOVERNANÇA" title="Usuários da plataforma"><Stack direction="row" spacing={1} alignItems="center"><Chip label={`${pending} pendente${pending === 1 ? '' : 's'}`} color={pending > 0 ? 'warning' : 'default'} variant={pending > 0 ? 'filled' : 'outlined'} /><Button variant="contained" startIcon={<Add />} onClick={() => open('user')}>Adicionar usuário</Button></Stack></Header><Box className="user-admin-grid"><Paper className="panel"><Box className="panel-title"><Box><Typography variant="h6">Usuários</Typography><Typography variant="body2" color="text.secondary">Cadastros novos ficam pendentes até a aprovação do administrador.</Typography></Box></Box><SimpleTable headings={['Usuário', 'E-mail', 'Função', 'Status', 'Ações']} rows={users.map((user: User) => [<Stack direction="row" spacing={1} alignItems="center"><Avatar>{user.nome.split(' ').map(value => value[0]).slice(0, 2).join('')}</Avatar><Typography fontWeight={700}>{user.nome}</Typography></Stack>, user.email, user.funcao || '—', <Chip label={user.status ? 'Ativo' : 'Pendente'} color={user.status ? 'success' : 'warning'} size="small" />, <Stack direction="row">{!user.status && <IconButton size="small" color="success" aria-label="Aprovar cadastro" onClick={() => onToggleStatus(user)}><CheckCircleOutline /></IconButton>}<IconButton size="small" aria-label={`Editar ${user.nome}`} onClick={() => open('user', user)}><EditOutlined /></IconButton><IconButton size="small" aria-label={`Remover ${user.nome}`} color="error" onClick={() => remove(user.id)}><DeleteOutline /></IconButton></Stack>])} /></Paper><Paper className="panel"><Box className="panel-title"><Box><Typography variant="h6">Funções</Typography><Typography variant="body2" color="text.secondary">Papéis disponíveis no sistema</Typography></Box></Box><Stack spacing={1.5}>{roles.map((role: Role) => <Box className="role-row" key={role.id}><Box flex={1}><Typography fontWeight={800}>{role.nome}</Typography><Typography variant="body2" color="text.secondary">{role.descricao}</Typography></Box><Chip label={role.id} size="small" variant="outlined" /></Box>)}</Stack></Paper></Box></>; }
function SimpleTable({ headings, rows }: any) { return <div className="table-wrap"><table><thead><tr>{headings.map((heading: any, index: number) => <th key={index}>{heading}</th>)}</tr></thead><tbody>{rows.map((row: any[], index: number) => <tr key={index}>{row.map((cell: any, cellIndex: number) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>; }
function AppDialog({ modal, editing, catalog, medicines, suppliers, roles, onClose, onMedicine, onOrder, onEntity, onUser, onMovement }: any) { const submit = (callback: any) => (event: any) => { event.preventDefault(); callback(new FormData(event.currentTarget)).catch?.(() => undefined); }; const field = (name: string, label: string, value = '', type = 'text', required = true) => <TextField name={name} label={label} defaultValue={value} type={type} fullWidth required={required} margin="dense" InputLabelProps={type === 'date' ? { shrink: true } : undefined} inputProps={name === 'preco' ? { min: 0, step: '0.01', inputMode: 'decimal' } : name === 'senha' ? { minLength: 10, maxLength: 72 } : undefined} helperText={name === 'senha' ? 'Mínimo de 10 caracteres' : undefined} />; if (!modal) return null; const title = modal === 'medicine' ? (editing ? 'Editar medicamento' : 'Adicionar medicamento') : modal === 'movement' ? `Movimentar ${editing?.nome}` : modal === 'order' ? 'Novo pedido' : modal === 'entity' ? (editing ? 'Editar cadastro' : `Adicionar ${catalog === 'fornecedores' ? 'fornecedor' : 'unidade'}`) : (editing ? 'Editar usuário' : 'Adicionar usuário'); let body: any; let handler: any; if (modal === 'medicine') { handler = onMedicine; body = <><Box className="form-grid">{field('nome', 'Nome do medicamento', editing?.raw?.nome)}{field('principioAtivo', 'Princípio ativo', editing?.raw?.principioAtivo || editing?.raw?.nome)}</Box><Box className="form-grid">{field('concentracao', 'Concentração', editing?.raw?.concentracao || '', 'text', false)}{field('formaFarmaceutica', 'Forma farmacêutica', editing?.raw?.formaFarmaceutica || editing?.apresentacao || '', 'text', false)}</Box><Box className="form-grid">{field('lote', 'Lote do fabricante', editing?.raw?.lote || '', 'text', !editing || Boolean(editing.raw?.lote))}</Box><Box className="form-grid">{field('estoque', 'Estoque atual', editing?.estoque || 0, 'number')}{field('minimo', 'Estoque mínimo', editing?.minimo || 0, 'number')}</Box><Box className="form-grid">{field('validade', 'Validade', toDateInput(editing?.raw?.validade), 'date')}{field('preco', 'Preço unitário', editing?.preco || 0, 'number')}</Box><Select name="fornecedorId" defaultValue={editing?.fornecedorId || ''} fullWidth displayEmpty sx={{ mt: 1 }}><MenuItem value=""><em>Sem fornecedor</em></MenuItem>{suppliers.map((supplier: Entity) => <MenuItem key={supplier.id} value={supplier.id}>{supplier.nome}</MenuItem>)}</Select></>; } else if (modal === 'movement') { handler = onMovement; body = <><Select name="tipo" defaultValue="Entrada" fullWidth sx={{ mt: 1 }}><MenuItem value="Entrada">Entrada</MenuItem><MenuItem value="Saída">Saída</MenuItem></Select>{field('quantidade', 'Quantidade', '', 'number')}{field('documentoReferencia', 'Documento de referência', '', 'text', true)}{field('observacao', 'Motivo / observação', '', 'text', false)}</>; } else if (modal === 'order') { handler = onOrder; body = <>{field('dataPrevistaEntrega', 'Previsão de entrega', new Date().toISOString().slice(0, 10), 'date')}{field('quantidade', 'Quantidade solicitada', '', 'number')}{field('justificativa', 'Justificativa', '', 'text', false)}<Select name="medicamentoId" defaultValue={medicines[0]?.id || ''} fullWidth sx={{ mt: 1 }}>{medicines.map((medicine: Medicine) => <MenuItem key={medicine.id} value={medicine.id}>{medicine.nome} · Lote {medicine.raw?.lote || 'sem identificação'} · Val. {medicine.validade}</MenuItem>)}</Select></>; } else if (modal === 'entity') { handler = onEntity; body = <>{field('nome', catalog === 'fornecedores' ? 'Nome do fornecedor' : 'Nome da unidade', editing?.nome)}{catalog === 'fornecedores' ? <>{field('cnpj', 'CNPJ', editing?.raw?.cnpj || '', 'text', !editing)}<LocationFields city={editing?.raw?.cidade} uf={editing?.raw?.uf} />{field('prazoEntrega', 'Prazo de entrega (dias)', editing?.raw?.prazoEntrega || 7, 'number', false)}</> : <><Box className="form-grid">{field('codigo', 'Código', editing?.raw?.codigo || '', 'text', !editing)}<Select name="tipo" defaultValue={editing?.raw?.tipo || 'UBS'} fullWidth sx={{ mt: 1 }}><MenuItem value="UBS">UBS</MenuItem><MenuItem value="UPA">UPA</MenuItem><MenuItem value="HOSPITAL">Hospital</MenuItem><MenuItem value="CENTRO_ESPECIALIZADO">Centro especializado</MenuItem><MenuItem value="FARMACIA">Farmácia</MenuItem></Select></Box><LocationFields city={editing?.raw?.cidade} uf={editing?.raw?.uf} />{field('responsavel', 'Responsável da unidade', editing?.raw?.responsavel || '', 'text', false)}</>}</>; } else { handler = onUser; body = <>{field('nome', 'Nome completo', editing?.nome)}{field('email', 'E-mail', editing?.email, 'email')}{field('cpf', 'CPF', editing?.raw?.cpf || '', 'text', !editing)}{!editing && field('senha', 'Senha inicial', '', 'password', true)}<TextField select name="roleId" label="Função de acesso" defaultValue={editing?.roleId || 'ATENDENTE'} fullWidth margin="dense" required>{roles.filter((role: Role) => role.id !== 'SUPER_ADMIN').map((role: Role) => <MenuItem key={role.id} value={role.id}>{role.nome}</MenuItem>)}</TextField><TextField select name="cargo" label="Cargo / atribuição" defaultValue={editing?.raw?.cargo || cargoOptions[2]} fullWidth margin="dense" required>{editing?.raw?.cargo && !cargoOptions.includes(editing.raw.cargo) && <MenuItem value={editing.raw.cargo}>{editing.raw.cargo} (atual)</MenuItem>}{cargoOptions.map(option => <MenuItem key={option} value={option}>{option}</MenuItem>)}</TextField></>; } return <Dialog open onClose={onClose} fullWidth maxWidth="sm"><form onSubmit={submit(handler)}><DialogTitle>{title}</DialogTitle><DialogContent>{body}</DialogContent><DialogActions><Button onClick={onClose}>Cancelar</Button><Button variant="contained" type="submit">Salvar</Button></DialogActions></form></Dialog>; }

function UsersAdminView({ users, roles, open, remove, onToggleStatus, privacyRequests = [], onResolvePrivacyRequest, privacyTabFocus, searchRequest, show }: any) {
  const [tab, setTab] = useState<'usuarios' | 'permissoes' | 'historico' | 'privacidade'>('usuarios');
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<PermissionValue[]>([]);
  const [selectedRole, setSelectedRole] = useState('GESTOR');
  const [history, setHistory] = useState<AuditLog[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyAction, setHistoryAction] = useState('');
  const [historyModule, setHistoryModule] = useState('');
  const [historyResource, setHistoryResource] = useState('');
  const [historyUser, setHistoryUser] = useState('');
  const [historyStatus, setHistoryStatus] = useState('');
  const [historyStart, setHistoryStart] = useState('');
  const [historyEnd, setHistoryEnd] = useState('');
  const [historyOptions, setHistoryOptions] = useState<AuditOptions>({ acoes: [], modulos: [], recursos: [], usuarios: [], status: [] });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOutput, setHistoryOutput] = useState<'visualizar-pdf' | 'pdf' | 'csv'>('visualizar-pdf');
  const [auditIntegrity, setAuditIntegrity] = useState<{ valido: boolean; total: string; sequenciaErro: string | null } | null>(null);
  const [detail, setDetail] = useState<AuditLog | null>(null);
  const [permissionUser, setPermissionUser] = useState<any>(null);
  const [permissionValues, setPermissionValues] = useState<Record<string, boolean | null>>({});
  const [permissionCatalog, setPermissionCatalog] = useState<PermissionValue[]>([]);
  const [permissionQuery, setPermissionQuery] = useState('');
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [permissionSaving, setPermissionSaving] = useState(false);
  const [permissionError, setPermissionError] = useState('');
  const pendingUsers = users.filter((user: User) => !user.status);
  const pending = pendingUsers.length;
  const activeUsers = users.filter((user: User) => user.status).length;
  const [userQuery, setUserQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todas as funções');
  const [statusFilter, setStatusFilter] = useState<'todas' | 'ativas' | 'pendentes'>('todas');
  useEffect(() => { if (searchRequest?.page === 'usuarios') setUserQuery(searchRequest.query); }, [searchRequest]);
  useEffect(() => { if (privacyTabFocus) setTab('privacidade'); }, [privacyTabFocus]);
  const visibleUsers = users.filter((user: User) => `${user.nome} ${user.email}`.toLocaleLowerCase('pt-BR').includes(userQuery.toLocaleLowerCase('pt-BR')) && (roleFilter === 'Todas as funções' || user.roleId === roleFilter) && (statusFilter === 'todas' || (statusFilter === 'ativas' ? user.status : !user.status))).sort((a: User, b: User) => Number(a.status) - Number(b.status));
  const editableRoles = roles.filter((role: Role) => !['ADMIN', 'SUPER_ADMIN'].includes(role.id));
  const loadPermissions = async () => { try { const [rolesResponse, catalogResponse] = await Promise.all([api.get('/permissoes/papeis'), api.get('/permissoes/catalogo')]); setRolePermissions(rolesResponse.data); setCatalog(catalogResponse.data); } catch { /* mensagens genéricas são exibidas pelas operações */ } };
  const loadHistoryOptions = async () => { const { data } = await api.get<AuditOptions>('/auditoria/opcoes'); setHistoryOptions(data); };
  const historyParams = (overrides: Partial<Record<'acao' | 'modulo' | 'recurso' | 'usuarioId' | 'status' | 'dataInicio' | 'dataFim', string>> = {}) => { const value = (key: keyof typeof overrides, current: string) => overrides[key] ?? current; const params = new URLSearchParams(); const action = value('acao', historyAction); const module = value('modulo', historyModule); const resource = value('recurso', historyResource); const user = value('usuarioId', historyUser); const statusValue = value('status', historyStatus); const start = value('dataInicio', historyStart); const end = value('dataFim', historyEnd); if (action) params.set('acao', action); if (module) params.set('modulo', module); if (resource) params.set('recurso', resource); if (user) params.set('usuarioId', user); if (statusValue) params.set('status', statusValue); if (start) params.set('dataInicio', `${start}T00:00:00.000Z`); if (end) params.set('dataFim', `${end}T23:59:59.999Z`); return params; };
  const loadHistory = async (page = historyPage, refreshOptions = false, overrides?: Partial<Record<'acao' | 'modulo' | 'recurso' | 'usuarioId' | 'status' | 'dataInicio' | 'dataFim', string>>) => { setHistoryLoading(true); try { if (refreshOptions) await loadHistoryOptions(); const params = historyParams(overrides); params.set('page', String(page)); params.set('limit', '20'); const { data } = await api.get(`/auditoria?${params.toString()}`); setHistory(data.data); setHistoryTotalPages(data.meta.totalPages || 1); setHistoryPage(page); } catch { setHistory([]); } finally { setHistoryLoading(false); } };
  useEffect(() => { if (tab === 'permissoes') loadPermissions(); if (tab === 'historico') loadHistory(1, true); }, [tab]);
  const selectedRoleData = rolePermissions.find((item) => item.role === selectedRole);
  const filteredPermissionCatalog = permissionCatalog.filter((permission) => `${permission.nome} ${permission.chave} ${permission.modulo}`.toLocaleLowerCase('pt-BR').includes(permissionQuery.trim().toLocaleLowerCase('pt-BR')));
  const permissionGroups = Object.entries(filteredPermissionCatalog.reduce<Record<string, PermissionValue[]>>((groups, permission) => { (groups[permission.modulo] ||= []).push(permission); return groups; }, {}));
  const permissionExceptionCount = Object.values(permissionValues).filter(value => value !== null).length;
  const permittedExceptionCount = Object.values(permissionValues).filter(value => value === true).length;
  const blockedExceptionCount = Object.values(permissionValues).filter(value => value === false).length;
  const changeRolePermission = (chave: string, permitido: boolean) => setRolePermissions(current => current.map(item => item.role === selectedRole ? { ...item, permissoes: item.permissoes.map((permission: PermissionValue) => permission.chave === chave ? { ...permission, permitido } : permission) } : item));
  const saveRolePermissions = async () => { if (!selectedRoleData) return; await api.put(`/permissoes/papeis/${selectedRole}`, { permissoes: selectedRoleData.permissoes.map((permission: PermissionValue) => ({ chave: permission.chave, permitido: permission.permitido })) }); };
  const openPermissions = async (user: User) => { setPermissionUser(user); setPermissionLoading(true); setPermissionError(''); setPermissionQuery(''); setPermissionCatalog([]); setPermissionValues({}); try { const { data } = await api.get(`/permissoes/usuarios/${user.id}`); const overrides = Object.fromEntries(data.excecoes.map((item: any) => [item.chave, item.permitido])); setPermissionCatalog(data.permissoes); setPermissionValues(Object.fromEntries(data.permissoes.map((item: PermissionValue) => [item.chave, overrides[item.chave] ?? null]))); } catch (error: unknown) { setPermissionUser(null); show(getApiErrorMessage(error, 'Não foi possível carregar as permissões deste usuário.')); } finally { setPermissionLoading(false); } };
  const saveUserPermissions = async () => { if (!permissionUser) return; setPermissionSaving(true); setPermissionError(''); try { await api.put(`/permissoes/usuarios/${permissionUser.id}`, { permissoes: Object.entries(permissionValues).filter(([, value]) => value !== null).map(([chave, permitido]) => ({ chave, permitido })) }); setPermissionUser(null); } catch (error: unknown) { setPermissionError(getApiErrorMessage(error, 'Não foi possível salvar as exceções.')); } finally { setPermissionSaving(false); } };
  const exportHistory = async (output: 'visualizar-pdf' | 'pdf' | 'csv') => { const formato = output === 'csv' ? 'CSV' : 'PDF'; const preview = output === 'visualizar-pdf' ? window.open('', '_blank') : null; try { const params = historyParams(); params.set('formato', formato); const response = await api.get(`/auditoria/exportar?${params.toString()}`, { responseType: 'blob' }); const url = URL.createObjectURL(response.data); if (preview) { preview.location.href = url; setTimeout(() => URL.revokeObjectURL(url), 60000); return; } const link = document.createElement('a'); link.href = url; link.download = `historico-auditoria.${formato.toLowerCase()}`; link.click(); URL.revokeObjectURL(url); } catch { preview?.close(); } };
  const verifyAuditIntegrity = async () => { try { const { data } = await api.get('/auditoria/integridade'); setAuditIntegrity(data); show(data.valido ? `Integridade válida: ${data.total} registros verificados.` : `Falha de integridade na sequência ${data.sequenciaErro}.`); } catch { show('Não foi possível verificar a integridade do histórico.'); } };
  const clearHistoryFilters = () => { setHistoryAction(''); setHistoryModule(''); setHistoryResource(''); setHistoryUser(''); setHistoryStatus(''); setHistoryStart(''); setHistoryEnd(''); };
  const pendingChip = <Chip label={`${pending} pendente${pending === 1 ? '' : 's'}`} color={pending > 0 ? 'warning' : 'default'} variant={pending > 0 ? 'filled' : 'outlined'} />;
  return <>
    <Header eyebrow="ACESSO E GOVERNANÇA INSTITUCIONAL" title="Usuários e Perfis de Acesso"><Stack direction="row" spacing={1} alignItems="center">{pendingChip}<Button variant="outlined" startIcon={<Assessment />} onClick={() => { setTab('historico'); void exportHistory('csv'); }}>Exportar trilha</Button><Button variant="contained" startIcon={<Add />} onClick={() => open('user')}>Adicionar usuário</Button></Stack></Header>
    <Box className="user-overview"><Paper className="stock-stat"><span>Contas cadastradas</span><strong>{users.length.toLocaleString('pt-BR')}</strong><small>Todos os perfis da rede</small></Paper><Paper className="stock-stat"><span>Contas ativas</span><strong>{activeUsers.toLocaleString('pt-BR')}</strong><small>Acesso aprovado</small></Paper><Paper className="stock-stat stock-stat-warning"><span>Aguardando aprovação</span><strong>{pending.toLocaleString('pt-BR')}</strong><small>Solicitações pendentes</small></Paper><Paper className="stock-stat"><span>Funções de acesso</span><strong>{roles.length.toLocaleString('pt-BR')}</strong><small>Papéis definidos na plataforma</small></Paper></Box>
    <Paper className="panel user-tabs-panel"><Box className="tabs"><Button className={tab === 'usuarios' ? 'tab-selected' : ''} onClick={() => setTab('usuarios')}>Contas e aprovações</Button><Button className={tab === 'privacidade' ? 'tab-selected' : ''} onClick={() => setTab('privacidade')}>Solicitações LGPD <span>{privacyRequests.filter((request: any) => !['CONCLUIDA', 'RECUSADA'].includes(request.status)).length}</span></Button><Button className={tab === 'permissoes' ? 'tab-selected' : ''} onClick={() => setTab('permissoes')}>Permissões</Button><Button className={tab === 'historico' ? 'tab-selected' : ''} onClick={() => setTab('historico')}>Histórico</Button></Box></Paper>
    {tab === 'usuarios' && <Box className="user-admin-layout">
      <Paper className="panel user-directory-panel">
        <Box className="panel-title">
          <Box><Typography variant="h6">Usuários cadastrados</Typography><Typography variant="body2" color="text.secondary">Filtre e gerencie contas, aprovações e perfis em um só lugar.</Typography></Box>
          <Chip label={`${visibleUsers.length} de ${users.length}`} size="small" variant="outlined" />
        </Box>
        <Box className="user-list-toolbar">
          <Box className="user-status-tabs" role="group" aria-label="Filtrar contas por status">
            <Button className={statusFilter === 'todas' ? 'selected' : ''} aria-pressed={statusFilter === 'todas'} onClick={() => setStatusFilter('todas')}><span className="status-tab-label">Todas</span><span className="status-tab-count">{users.length}</span></Button>
            <Button className={statusFilter === 'ativas' ? 'selected' : ''} aria-pressed={statusFilter === 'ativas'} onClick={() => setStatusFilter('ativas')}><span className="status-tab-label">Ativas</span><span className="status-tab-count">{activeUsers}</span></Button>
            <Button className={statusFilter === 'pendentes' ? 'selected' : ''} aria-pressed={statusFilter === 'pendentes'} onClick={() => setStatusFilter('pendentes')}><span className="status-tab-label">Pendentes</span><span className="status-tab-count">{pending}</span></Button>
          </Box>
          <Box className="toolbar user-filters">
            <TextField size="small" placeholder="Buscar nome ou e-mail" value={userQuery} onChange={event => setUserQuery(event.target.value)} inputProps={{ 'aria-label': 'Buscar usuário por nome ou e-mail' }} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
            <Select size="small" value={roleFilter} onChange={event => setRoleFilter(String(event.target.value))} inputProps={{ 'aria-label': 'Filtrar por função' }}><MenuItem value="Todas as funções">Todas as funções</MenuItem>{roles.map((role: Role) => <MenuItem key={role.id} value={role.id}>{role.nome}</MenuItem>)}</Select>
          </Box>
        </Box>
        <SimpleTable headings={['Profissional', 'Perfil e atribuição', 'Status', 'Ações']} rows={visibleUsers.map((user: User) => {
          const superAdmin = user.roleId === 'SUPER_ADMIN';
          const approvalDisabled = user.status || superAdmin;
          const approvalTitle = user.status ? 'Cadastro já aprovado' : superAdmin ? 'Aprovação indisponível para Super Admin' : 'Aprovar cadastro';
          const editTitle = superAdmin ? 'Edição indisponível para Super Admin' : 'Editar usuário';
          const permissionsTitle = superAdmin ? 'Permissões fixas para Super Admin' : 'Gerenciar permissões';
          const deleteTitle = superAdmin ? 'Exclusão indisponível para Super Admin' : 'Excluir usuário';
          return [
            <Stack className="user-identity-cell" direction="row" spacing={1} alignItems="center"><Avatar>{user.nome.split(' ').map(value => value[0]).slice(0, 2).join('')}</Avatar><Box><Typography fontWeight={700}>{user.nome}</Typography><Typography variant="body2" color="text.secondary">{user.email}</Typography></Box></Stack>,
            <Box className="user-role-cell"><Typography fontWeight={650}>{user.funcao || '—'}</Typography><Typography variant="body2" color="text.secondary">{user.raw?.cargo || 'Atribuição não informada'}</Typography></Box>,
            <Chip label={user.status ? 'Ativa' : 'Pendente'} color={user.status ? 'success' : 'warning'} size="small" />,
            <Box className="user-row-actions">
              <IconButton size="small" aria-label={approvalTitle} disabled={approvalDisabled} color="success" onClick={() => onToggleStatus(user)}><CheckCircleOutline /></IconButton>
              <IconButton size="small" aria-label={editTitle} disabled={superAdmin} onClick={() => open('user', user)}><EditOutlined /></IconButton>
              <IconButton size="small" aria-label={permissionsTitle} disabled={superAdmin} onClick={() => openPermissions(user)}><AdminPanelSettings /></IconButton>
              <IconButton size="small" aria-label={deleteTitle} disabled={superAdmin} color="error" onClick={() => remove(user.id)}><DeleteOutline /></IconButton>
            </Box>,
          ];
        })} />
        {!visibleUsers.length && <Box className="user-empty-state"><Typography fontWeight={700}>Nenhuma conta encontrada</Typography><Typography variant="body2" color="text.secondary">Ajuste os filtros ou a busca para ver outros usuários.</Typography></Box>}
      </Paper>
      <Box className="user-governance-column">
        <Paper className="panel user-queue-panel">
          <Box className="panel-title"><Box><Typography variant="h6">Aprovações</Typography><Typography variant="body2" color="text.secondary">Contas aguardando liberação</Typography></Box><Chip label={pending} size="small" color={pending ? 'warning' : 'default'} /></Box>
          {pendingUsers.length ? <Stack className="user-approval-list" spacing={1}>{pendingUsers.slice(0, 4).map((user: User) => <Box className="user-approval-row" key={user.id}><Avatar>{user.nome.split(' ').map((value: string) => value[0]).slice(0, 2).join('')}</Avatar><Box className="user-approval-copy"><Typography fontWeight={700}>{user.nome}</Typography><Typography variant="body2" color="text.secondary">{user.funcao} · {user.email}</Typography></Box><IconButton size="small" color="success" aria-label={`Aprovar ${user.nome}`} title={`Aprovar ${user.nome}`} onClick={() => onToggleStatus(user)}><CheckCircleOutline /></IconButton></Box>)}</Stack> : <Box className="user-queue-empty"><CheckCircleOutline /><Typography variant="body2">Nenhuma conta aguardando aprovação.</Typography></Box>}
          {pendingUsers.length > 4 && <Button size="small" onClick={() => setStatusFilter('pendentes')}>Ver todas as {pending} solicitações</Button>}
        </Paper>
        <Paper className="panel user-roles-panel">
          <Box className="panel-title"><Box><Typography variant="h6">Funções de acesso</Typography><Typography variant="body2" color="text.secondary">Perfis e contas vinculadas</Typography></Box></Box>
          <Stack className="user-role-list" spacing={0.5}>{roles.map((role: Role) => {
            const roleUsers = users.filter((user: User) => user.roleId === role.id).length;
            const canManage = editableRoles.some((item: Role) => item.id === role.id);
            return <Box className="user-role-summary" key={role.id}><Box><Typography fontWeight={700}>{role.nome}</Typography><Typography variant="body2" color="text.secondary">{roleUsers} conta{roleUsers === 1 ? '' : 's'} · {role.descricao}</Typography></Box><Button size="small" disabled={!canManage} aria-label={`Gerenciar função ${role.nome}`} onClick={() => { setSelectedRole(role.id); setTab('permissoes'); }}>Gerenciar</Button></Box>;
          })}</Stack>
        </Paper>
      </Box>
    </Box>}
    {tab === 'privacidade' && <Paper className="panel"><Box className="panel-title"><Box><Typography variant="h6">Solicitações de privacidade</Typography><Typography variant="body2" color="text.secondary">Atenda solicitações de acesso, correção e eliminação com trilha de auditoria.</Typography></Box><Chip size="small" color="warning" label={`${privacyRequests.filter((request: any) => !['CONCLUIDA', 'RECUSADA'].includes(request.status)).length} em aberto`} /></Box><SimpleTable headings={['Solicitante', 'Tipo', 'Recebida em', 'Situação', 'Ações']} rows={privacyRequests.map((request: any) => [<Box><Typography fontWeight={700}>{request.usuario?.nome || 'Usuário'}</Typography><Typography variant="body2" color="text.secondary">{request.usuario?.email || ''}</Typography></Box>, ({ ACESSO: 'Acesso aos dados', CORRECAO: 'Correção de dados', ELIMINACAO: 'Eliminação de dados' } as Record<string, string>)[request.tipo] || request.tipo, formatDate(request.createdAt), <Chip size="small" label={request.status === 'ABERTA' ? 'Aguardando' : request.status === 'EM_ANALISE' ? 'Em análise' : request.status === 'CONCLUIDA' ? 'Concluída' : 'Recusada'} color={request.status === 'CONCLUIDA' ? 'success' : request.status === 'RECUSADA' ? 'default' : 'warning'} />, request.status === 'ABERTA' ? <Button size="small" onClick={() => onResolvePrivacyRequest(request, 'EM_ANALISE')}>Iniciar análise</Button> : request.status === 'EM_ANALISE' ? <Stack direction="row" spacing={0.5}><Button size="small" color="success" onClick={() => onResolvePrivacyRequest(request, 'CONCLUIDA')}>Concluir</Button><Button size="small" color="error" onClick={() => onResolvePrivacyRequest(request, 'RECUSADA')}>Recusar</Button></Stack> : '—'])} /></Paper>}
    {tab === 'permissoes' && <Paper className="panel"><Box className="toolbar"><Select size="small" value={selectedRole} onChange={event => setSelectedRole(String(event.target.value))}>{editableRoles.map((role: Role) => <MenuItem key={role.id} value={role.id}>{role.nome}</MenuItem>)}</Select><Button variant="contained" onClick={saveRolePermissions}>Salvar permissões do papel</Button></Box><Typography variant="body2" color="text.secondary" mb={2}>ADMIN e SUPER_ADMIN possuem acesso total e não podem ser limitados por esta matriz.</Typography><Stack spacing={1}>{(selectedRoleData?.permissoes || catalog).map((permission: PermissionValue) => <Box className="permission-row" key={permission.chave}><Checkbox checked={Boolean(permission.permitido)} onChange={event => changeRolePermission(permission.chave, event.target.checked)} /><Typography>{permission.nome}</Typography><Chip size="small" label={permission.chave} variant="outlined" /></Box>)}</Stack></Paper>}
    {tab === 'historico' && <Paper className="panel"><Box className="toolbar"><Select size="small" displayEmpty value={historyAction} onChange={event => { const value = String(event.target.value); setHistoryAction(value); void loadHistory(1, false, { acao: value }); }} aria-label="Filtrar por ação"><MenuItem value="">Todas as ações</MenuItem>{historyOptions.acoes.map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select><Select size="small" displayEmpty value={historyModule} onChange={event => { const value = String(event.target.value); setHistoryModule(value); void loadHistory(1, false, { modulo: value }); }} aria-label="Filtrar por módulo"><MenuItem value="">Todos os módulos</MenuItem>{historyOptions.modulos.map(value => <MenuItem key={value} value={value}>{auditModuleLabel(value)}</MenuItem>)}</Select><Select size="small" displayEmpty value={historyResource} onChange={event => { const value = String(event.target.value); setHistoryResource(value); void loadHistory(1, false, { recurso: value }); }} aria-label="Filtrar por recurso"><MenuItem value="">Todos os recursos</MenuItem>{historyOptions.recursos.map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select><Select size="small" displayEmpty value={historyUser} onChange={event => { const value = String(event.target.value); setHistoryUser(value); void loadHistory(1, false, { usuarioId: value }); }} aria-label="Filtrar por usuário"><MenuItem value="">Todos os usuários</MenuItem>{historyOptions.usuarios.map(user => <MenuItem key={user.id} value={user.id}>{user.nome}{user.email ? ` — ${user.email}` : ''}</MenuItem>)}</Select><Select size="small" displayEmpty value={historyStatus} onChange={event => { const value = String(event.target.value); setHistoryStatus(value); void loadHistory(1, false, { status: value }); }} aria-label="Filtrar por status"><MenuItem value="">Todos os status</MenuItem>{historyOptions.status.map(item => <MenuItem key={item.valor} value={item.valor}>{item.nome}</MenuItem>)}</Select><TextField size="small" type="date" label="De" value={historyStart} onChange={event => { const value = event.target.value; setHistoryStart(value); void loadHistory(1, false, { dataInicio: value }); }} InputLabelProps={{ shrink: true }} /><TextField size="small" type="date" label="Até" value={historyEnd} onChange={event => { const value = event.target.value; setHistoryEnd(value); void loadHistory(1, false, { dataFim: value }); }} InputLabelProps={{ shrink: true }} /><Button variant="text" onClick={() => { clearHistoryFilters(); void loadHistory(1, true, { acao: '', modulo: '', recurso: '', usuarioId: '', status: '', dataInicio: '', dataFim: '' }); }}>Limpar</Button><Button variant="outlined" onClick={() => void verifyAuditIntegrity()}>Verificar integridade</Button>{auditIntegrity && <Chip size="small" color={auditIntegrity.valido ? "success" : "error"} label={auditIntegrity.valido ? `Íntegra: ${auditIntegrity.total}` : `Falha na sequência ${auditIntegrity.sequenciaErro}`} />}<Stack direction="row" spacing={1} alignItems="center" className="history-output-group"><Select variant="outlined" size="small" className={`history-output-select history-output-${historyOutput}`} value={historyOutput} onChange={event => setHistoryOutput(event.target.value as 'visualizar-pdf' | 'pdf' | 'csv')} aria-label="Formato do relatório"><MenuItem value="visualizar-pdf">Visualizar PDF</MenuItem><MenuItem value="pdf">Exportar PDF</MenuItem><MenuItem value="csv">Exportar CSV</MenuItem></Select><Button variant="contained" className={`history-output-button history-output-button-${historyOutput}`} onClick={() => void exportHistory(historyOutput)}>Gerar relatório</Button></Stack></Box><SimpleTable headings={['Data', 'Usuário', 'Ação', 'Módulo', 'Descrição', 'Identificador de IP', 'Status', 'Detalhes']} rows={history.map((item) => [new Date(item.createdAt).toLocaleString('pt-BR'), item.usuarioNome || 'Sistema', item.acao, auditModuleLabel(item.modulo), item.descricao, item.ip ? <code className="audit-ip" title={`HMAC completo: ${item.ip}`}>{item.ip.slice(0, 12)}…</code> : '—', item.sucesso ? 'Sucesso' : 'Falha', <Button size="small" onClick={() => setDetail(item)}>Ver</Button>])} /><AccessiblePagination count={historyTotalPages} page={historyPage} onChange={(_, page) => loadHistory(page)} sx={{ mt: 2 }} /></Paper>}
    <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} fullWidth maxWidth="md"><DialogTitle>Detalhes da auditoria</DialogTitle><DialogContent><Typography variant="body2" mb={1}>{detail?.descricao}</Typography><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify({ sequencia: detail?.sequencia, hashAnterior: detail?.previousHash, hashEvento: detail?.eventHash, antes: detail?.dadosAntes, depois: detail?.dadosDepois, identificadorIpHmac: detail?.ip, navegador: detail?.usuarioEmail }, null, 2)}</pre></DialogContent><DialogActions><Button onClick={() => setDetail(null)}>Fechar</Button></DialogActions></Dialog>
    <Dialog open={Boolean(permissionUser)} onClose={() => setPermissionUser(null)} fullWidth maxWidth="lg" PaperProps={{ className: 'permission-exception-dialog' }}>
      <DialogTitle className="permission-exception-title">
        <Box><Typography className="eyebrow">GOVERNANÇA DE ACESSO</Typography><Typography variant="h6">Exceções de permissões</Typography><Typography variant="body2" color="text.secondary">Defina acessos individuais sem alterar as permissões do papel.</Typography></Box>
        <IconButton aria-label="Fechar exceções de permissões" onClick={() => setPermissionUser(null)}>×</IconButton>
      </DialogTitle>
      <DialogContent className="permission-exception-content">
        <Box className="permission-exception-user"><Avatar>{String(permissionUser?.nome || 'U').split(' ').map((value: string) => value[0]).slice(0, 2).join('').toUpperCase()}</Avatar><Box className="permission-exception-user-copy"><Typography fontWeight={750}>{permissionUser?.nome}</Typography><Typography variant="body2" color="text.secondary">{permissionUser?.email}</Typography></Box><Chip size="small" label={roleLabels[permissionUser?.roleId] || permissionUser?.roleId || 'Perfil sem função'} /></Box>
        <Alert severity="info" variant="outlined" className="permission-exception-guidance">“Herdar do papel” usa a matriz de <strong>{roleLabels[permissionUser?.roleId] || permissionUser?.roleId || 'acesso atual'}</strong>. Permitir ou bloquear cria uma exceção individual e auditada.</Alert>
        <Box className="permission-exception-summary">
          <Paper className="permission-exception-stat"><span>Permissões avaliadas</span><strong>{permissionCatalog.length}</strong><small>Catálogo disponível para este perfil</small></Paper>
          <Paper className="permission-exception-stat"><span>Exceções ativas</span><strong>{permissionExceptionCount}</strong><small>Regras individuais configuradas</small></Paper>
          <Paper className="permission-exception-stat permission-exception-allow"><span>Acessos liberados</span><strong>{permittedExceptionCount}</strong><small>Exceções que permitem</small></Paper>
          <Paper className="permission-exception-stat permission-exception-deny"><span>Acessos bloqueados</span><strong>{blockedExceptionCount}</strong><small>Exceções que restringem</small></Paper>
        </Box>
        <Box className="permission-exception-toolbar"><Box><Typography fontWeight={750}>Permissões por módulo</Typography><Typography variant="body2" color="text.secondary">O acesso efetivo considera a exceção individual ou a regra herdada.</Typography></Box><TextField size="small" placeholder="Buscar permissão" value={permissionQuery} onChange={event => setPermissionQuery(event.target.value)} inputProps={{ 'aria-label': 'Buscar permissão' }} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} /></Box>
        {permissionLoading && <LinearProgress aria-label="Carregando permissões" />}
        {permissionError && <Alert severity="error">{permissionError}</Alert>}
        {!permissionLoading && permissionGroups.length === 0 && <Box className="permission-exception-empty"><AdminPanelSettings /><Typography fontWeight={700}>{permissionCatalog.length ? 'Nenhuma permissão encontrada' : 'Não há permissões para configurar'}</Typography><Typography variant="body2" color="text.secondary">{permissionCatalog.length ? 'Tente outro termo de busca.' : 'O catálogo deste perfil ainda não foi carregado.'}</Typography></Box>}
        <Box className="permission-exception-groups">{permissionGroups.map(([module, modulePermissions]) => <Paper component="section" className="permission-exception-module" key={module}>
          <Box className="permission-exception-module-heading"><Box><Typography fontWeight={750}>{permissionModuleLabels[module] || module}</Typography><Typography variant="body2" color="text.secondary">Controles de acesso deste módulo</Typography></Box><Chip size="small" variant="outlined" label={`${modulePermissions.length} ${modulePermissions.length === 1 ? 'permissão' : 'permissões'}`} /></Box>
          <Stack spacing={0.75}>{modulePermissions.map((permission) => { const setting = permissionValues[permission.chave] ?? null; const effective = setting === null ? permission.permitido : setting; return <Box className="permission-exception-row" key={permission.chave}>
            <Box className="permission-exception-copy"><Typography fontWeight={650}>{permission.nome}</Typography><Typography variant="caption">{permission.chave}</Typography><Box className="permission-exception-state"><Chip size="small" variant={setting === null ? 'outlined' : 'filled'} color={setting === null ? 'default' : setting ? 'success' : 'error'} label={setting === null ? 'Herdado do papel' : 'Exceção individual'} /><Typography variant="caption" color="text.secondary">Acesso efetivo: <strong>{effective ? 'Permitido' : 'Bloqueado'}</strong>{setting === null ? ' pelo papel' : ' por exceção'}</Typography></Box></Box>
            <Select size="small" className="permission-exception-select" value={setting === null ? 'inherit' : setting ? 'allow' : 'deny'} onChange={event => setPermissionValues(current => ({ ...current, [permission.chave]: event.target.value === 'inherit' ? null : event.target.value === 'allow' }))} inputProps={{ 'aria-label': `Configuração de ${permission.nome}` }}>
              <MenuItem value="inherit">Herdar do papel</MenuItem><MenuItem value="allow">Permitir</MenuItem><MenuItem value="deny">Bloquear</MenuItem>
            </Select>
          </Box>; })}</Stack>
        </Paper>)}</Box>
      </DialogContent>
      <DialogActions className="permission-exception-actions"><Typography variant="body2" color="text.secondary">{permissionExceptionCount} exceção{permissionExceptionCount === 1 ? '' : 'ões'} configurada{permissionExceptionCount === 1 ? '' : 's'}</Typography><Button onClick={() => setPermissionUser(null)}>Cancelar</Button><Button variant="contained" disabled={permissionLoading || permissionSaving} onClick={() => void saveUserPermissions()}>{permissionSaving ? 'Salvando…' : 'Salvar exceções'}</Button></DialogActions>
    </Dialog>
  </>;
}

export default App;
