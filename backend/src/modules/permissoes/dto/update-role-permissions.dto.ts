import { ArrayMaxSize, IsArray, IsBoolean, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PermissionValueDto {
  @IsString()
  @MaxLength(100)
  chave: string;

  @IsBoolean()
  permitido: boolean;
}

export class UpdateRolePermissionsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => PermissionValueDto)
  permissoes: PermissionValueDto[];
}
