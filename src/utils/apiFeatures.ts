class ApiFeatures {
  private query: string;
  private queryParams: any;

  constructor(query: string, queryParams: any) {
    this.query = query;
    this.queryParams = queryParams;
  }

  selectFields(fields: string[]) {
    const fieldsString = fields.join(", ");
    this.query = this.query.replace("*", fieldsString);
    return this;
  }

  filter() {
    const queryObj = { ...this.queryParams };
    const excludedFields = ["sort", "page", "limit"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Convert queryObj to SQL WHERE clause
    const filterConditions = Object.keys(queryObj)
      .map((key) => `${key} = '${queryObj[key]}'`)
      .join(" AND ");

    if (filterConditions) {
      this.query += ` WHERE ${filterConditions}`;
    }

    return this;
  }

  sort() {
    if (this.queryParams.sort) {
      const sortBy = this.queryParams.sort.split(",").join(" ");
      this.query += ` ORDER BY ${sortBy}`;
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryParams.page, 10) || 1;
    const limit = parseInt(this.queryParams.limit, 10) || 10;
    const offset = (page - 1) * limit;

    this.query += ` LIMIT ${limit} OFFSET ${offset}`;
    return this;
  }

  getQuery() {
    return this.query;
  }
}

export default ApiFeatures;
