import querystring from "querystring";
import { api } from "..";

class VacanciesAPI {
  /**
        При указании параметров пагинации (page, per_page) работает ограничение: 
        глубина возвращаемых результатов не может быть больше 2000. 
        Например, возможен запрос per_page=10&page=199 (выдача с 1991 по 2000 вакансию), но запрос с per_page=10&page=200 вернёт ошибку (выдача с 2001 по 2010 вакансию)
     */
  public async getSimilarVacancies(
    resume_id: string,
    page: number = 0,
    per_page?: number
  ) {
    try {
      const response = await api.getData(
        `resumes/${resume_id}/similar_vacancies?page=${page}&per_page=${
          per_page || 20
        }`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  public async searchVacancies(
    text: string,
    page: number = 0,
    per_page?: number
  ) {
    try {
      const params: { text: string; page: number } = {
        text,
        page,
      };

      const queryString = querystring.stringify(params);
      const response = await api.getData(`vacancies?${queryString}`);

      return response;
    } catch (error) {
      throw error;
    }
  }

  // отправить отклик
  public async sendNegotiations(data) {
    try {
      const response = await api.postData("negotiations", data);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

const vacanciesApiServer = new VacanciesAPI();

export { vacanciesApiServer };
