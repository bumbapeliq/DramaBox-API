import { token as generateToken } from './lib/token-generator.js';

const token = async () => {
    try {
        return await generateToken();
    } catch (error) {
        throw error;
    }
}

export { token };
export default { token };