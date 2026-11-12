import { IsBoolean } from 'class-validator';

export class ToggleStatusDto {
  @IsBoolean()
  ativo: boolean;
}
