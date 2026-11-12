import { validate } from 'class-validator';
import { ChangePasswordDto } from './change-password.dto';
import { RegisterDto } from './register-dto';
import { CreateUsuarioDto } from '../../usuarios/dto/create-usuario.dto';

describe('comprimento mínimo da senha', () => {
  it('aceita dez caracteres e rejeita nove no cadastro público', async () => {
    const base = { nome: 'Pessoa de Teste', email: 'pessoa@example.gov', cpf: '52998224725' };
    const tooShort = Object.assign(new RegisterDto(), base, { senha: '123456789' });
    const minimum = Object.assign(new RegisterDto(), base, { senha: '1234567890' });

    expect((await validate(tooShort)).some(error => error.property === 'senha')).toBe(true);
    expect(await validate(minimum)).toHaveLength(0);
  });

  it('aceita dez caracteres e rejeita nove ao criar usuários pela administração', async () => {
    const base = { nome: 'Pessoa de Teste', email: 'pessoa@example.gov', cpf: '52998224725' };
    const tooShort = Object.assign(new CreateUsuarioDto(), base, { senha: '123456789' });
    const minimum = Object.assign(new CreateUsuarioDto(), base, { senha: '1234567890' });

    expect((await validate(tooShort)).some(error => error.property === 'senha')).toBe(true);
    expect(await validate(minimum)).toHaveLength(0);
  });

  it('aplica o mínimo à nova senha e à confirmação (a senha atual só tem teto, pois contas antigas podem ter senhas curtas)', async () => {
    const tooShort = Object.assign(new ChangePasswordDto(), {
      senhaAtual: '123456789', novaSenha: '123456789', confirmarSenha: '123456789',
    });
    const minimum = Object.assign(new ChangePasswordDto(), {
      senhaAtual: '1234567890', novaSenha: '1234567890', confirmarSenha: '1234567890',
    });

    expect((await validate(tooShort)).map(error => error.property).sort()).toEqual([
      'confirmarSenha', 'novaSenha',
    ]);
    expect(await validate(minimum)).toHaveLength(0);
  });
});
