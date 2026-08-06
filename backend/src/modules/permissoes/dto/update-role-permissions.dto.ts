import { IsArray, IsBoolean, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PermissionValueDto {
  @IsString()
  chave: string;

  @IsBoolean()
  permitido: boolean;
}

export class UpdateRolePermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionValueDto)
  permissoes: PermissionValueDto[];
}
