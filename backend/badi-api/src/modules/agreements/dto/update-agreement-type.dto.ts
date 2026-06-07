import { PartialType } from '@nestjs/mapped-types';
import { CreateAgreementTypeDto } from './create-agreement-type.dto';

export class UpdateAgreementTypeDto extends PartialType(CreateAgreementTypeDto) {}
