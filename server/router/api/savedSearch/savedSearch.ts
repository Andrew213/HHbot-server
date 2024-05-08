import { api } from '..';

class SavedSearchAPI {
    public async getSavedSearch() {
        try {
            const response = await api.getData('saved_searches/vacancies');
            return response;
        } catch (error) {
            throw error;
        }
    }
}

const savedSearchServer = new SavedSearchAPI();

export { savedSearchServer };
