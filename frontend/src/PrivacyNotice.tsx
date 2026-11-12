import { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Link, Typography } from '@mui/material';
import api from './services/api';

type Aviso = { controlador: string; encarregado: { nome: string; email: string | null }; versao: string; atualizadoEm: string; prazoRespostaDias: number };

const fallback: Aviso = { controlador: 'Prefeitura Municipal — Secretaria de Saúde', encarregado: { nome: 'Encarregado(a) pelo tratamento de dados pessoais', email: null }, versao: '1.0', atualizadoEm: '2026-11-12', prazoRespostaDias: 15 };

/** Aviso de privacidade (LGPD arts. 9º e 23, I): finalidade, base legal, direitos e contato do encarregado. */
export default function PrivacyNotice({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [aviso, setAviso] = useState<Aviso>(fallback);
  useEffect(() => { if (open) void api.get('/privacidade/aviso').then(({ data }) => setAviso(data)).catch(() => setAviso(fallback)); }, [open]);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="privacy-title" scroll="paper">
      <DialogTitle id="privacy-title">Aviso de privacidade</DialogTitle>
      <DialogContent dividers>
        <Box component="section" sx={{ display: 'grid', gap: 1.5 }}>
          <Typography variant="body2" color="text.secondary">Versão {aviso.versao} • atualizado em {aviso.atualizadoEm}</Typography>
          <Typography><b>Quem trata seus dados:</b> {aviso.controlador} (controlador).</Typography>
          <Typography><b>Quais dados:</b> nome, e-mail institucional, CPF, telefone, cargo, perfil de acesso e registros de uso (data/hora, ação realizada e identificador de rede protegido por hash).</Typography>
          <Typography><b>Para quê:</b> identificar quem acessa o sistema e registrar quem realizou cada movimentação de estoque, pedido ou alteração, para controle patrimonial e sanitário da assistência farmacêutica.</Typography>
          <Typography><b>Base legal:</b> cumprimento de obrigação legal ou regulatória e execução de políticas públicas (LGPD, arts. 7º, II e III, e 23). Não usamos consentimento como base para o funcionamento do sistema.</Typography>
          <Typography><b>Compartilhamento:</b> não há venda ou compartilhamento com empresas privadas. Dados de gestão podem ser enviados a órgãos de saúde quando houver norma que o exija.</Typography>
          <Typography><b>Por quanto tempo:</b> pelo prazo necessário às finalidades e às regras de guarda de documentos públicos e sanitários; depois, eliminação ou anonimização.</Typography>
          <Typography><b>Seus direitos (LGPD, art. 18):</b> confirmação, acesso, correção, anonimização/bloqueio/eliminação quando cabível, portabilidade e informação sobre compartilhamento. Respondemos em até {aviso.prazoRespostaDias} dias. Dados que precisam ser guardados por lei não podem ser apagados antes do prazo, e você receberá a justificativa.</Typography>
          <Typography><b>Encarregado (DPO):</b> {aviso.encarregado.nome}{aviso.encarregado.email ? <> — <Link href={`mailto:${aviso.encarregado.email}`}>{aviso.encarregado.email}</Link></> : ' — contato a ser divulgado pelo município.'}</Typography>
        </Box>
      </DialogContent>
      <DialogActions><Button onClick={onClose} autoFocus>Fechar</Button></DialogActions>
    </Dialog>
  );
}
