export class DataService {
  async fetchData<T>(endpoint: string): Promise<T> {
    console.log(`[DataService] Fetching from ${endpoint}`)
    throw new Error('DataService not implemented yet')
  }

  async saveData<T>(endpoint: string, data: T): Promise<void> {
    console.log(`[DataService] Saving to ${endpoint}`, data)
    throw new Error('DataService not implemented yet')
  }

  async deleteData(endpoint: string, id: string): Promise<void> {
    console.log(`[DataService] Deleting ${id} from ${endpoint}`)
    throw new Error('DataService not implemented yet')
  }
}

export const dataService = new DataService()
