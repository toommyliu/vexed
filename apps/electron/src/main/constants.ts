import { join } from 'path';
import { app } from 'electron';

export const BRAND = 'Vexed';
export const DOCUMENTS_PATH = join(app.getPath('documents'), BRAND);
