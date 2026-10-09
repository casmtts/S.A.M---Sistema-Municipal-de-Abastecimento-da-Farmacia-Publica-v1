import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUsuarioDto } from './create-usuario.dto';

// Status is changed only by the approval/deactivation endpoint. Passwords use
// the authenticated password flow, never the generic user-edit operation.
export class UpdateUsuarioDto extends PartialType(OmitType(CreateUsuarioDto, ['senha', 'ativo'] as const)) {}
