import type { SchemaCarryingClass } from '@barnuri/zod-decorators';
import { z } from 'zod';

export const nodesOf = (dto: SchemaCarryingClass) => z.object({ nodes: z.array(dto.schema) });
