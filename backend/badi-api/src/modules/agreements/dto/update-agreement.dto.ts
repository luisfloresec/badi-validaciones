import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateAgreementDto } from './create-agreement.dto';

export class UpdateAgreementDto extends PartialType(OmitType(CreateAgreementDto, ['organizationId'] as const)) {}
