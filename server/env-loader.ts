import dotenv from 'dotenv';
import path from 'path';

const nodeEnv = process.env.NODE_ENV || 'development';

// Load variables from files (first loaded wins, so load in order of highest to lowest precedence)
dotenv.config({ path: path.resolve(process.cwd(), `.env.${nodeEnv}.local`) });
dotenv.config({ path: path.resolve(process.cwd(), `.env.${nodeEnv}`) });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
