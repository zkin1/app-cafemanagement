export class SQLiteMock {
    create() {
      return Promise.resolve({
        executeSql: () => Promise.resolve({ rows: { items: [] } }),
        transaction: (fn: any) => Promise.resolve(),
        close: () => Promise.resolve()
      });
    }
  }