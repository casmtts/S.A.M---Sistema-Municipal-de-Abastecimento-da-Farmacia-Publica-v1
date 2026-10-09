import { validate } from 'class-validator';
import { ChangePasswordDto } from './change-password.dto';
import { RegisterDto } from './register-dto';
import { CreateUsuarioDto } from '../../usuarios/dto/create-usuario.dto';

describe('comprimento mínimo da senha', () => {
  it('aceita seis caracteres e rejeita cinco no cadastro público', async () => {
    const base = { nome: 'Pessoa de Teste', email: 'pessoa@example.gov', cpf: '52998224725' };
    const tooShort = Object.assign(new RegisterDto(), base, { senha: '12345' });
    const minimum = Object.assign(new RegisterDto(), base, { senha: '123456' });

    expect((await validate(tooShort)).some(error => error.property === 'senha')).toBe(true);
    expect(await validate(minimum)).toHaveLength(0);
  });

  it('aceita seis caracteres e rejeita cinco ao criar usuários pela administração', async () => {
    const base = { nome: 'Pessoa de Teste', email: 'pessoa@example.gov', cpf: '52998224725' };
    const tooShort = Object.assign(new CreateUsuarioDto(), base, { senha: '12345' });
    const minimum = Object.assign(new CreateUsuarioDto(), base, { senha: '123456' });

    expect((await validate(tooShort)).some(error => error.property === 'senha')).toBe(true);
    expect(await validate(minimum)).toHaveLength(0);
  });

  it('aplica o mínimo a senha atual, nova e confirmação na troca de senha', async () => {
    const tooShort = Object.assign(new ChangePasswordDto(), {
      senhaAtual: '12345', novaSenha: '12345', confirmarSenha: '12345',
    });
    const minimum = Object.assign(new ChangePasswordDto(), {
      senhaAtual: '123456', novaSenha: '123456', confirmarSenha: '123456',
    });

    expect((await validate(tooShort)).map(error => error.property).sort()).toEqual([
      'confirmarSenha', 'novaSenha', 'senhaAtual',
    ]);
    expect(await validate(minimum)).toHaveLength(0);
  });
});
