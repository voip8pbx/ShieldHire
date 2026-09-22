import api from './api';

export const uploadImageToBlob = async (base64Image: string, filename: string, folder: string = 'bouncers'): Promise<string> => {
    try {
        const response = await api.post('/upload', {
            image: base64Image,
            filename,
            folder
        });
        return response.data.url;
    } catch (error) {
        console.error('Error in uploadImageToBlob:', error);
        throw error;
    }
};
