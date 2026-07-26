export const create = async ({ model, data, options = {} } = {}) => {
  return await model.create([data], options).then((docs) => docs[0]);
};

export const findOne = async ({
  model,
  filter = {},
  populate = [],
  sort = {},
  select = "",
  options = {},
} = {}) => {
  const query = model
    .findOne(filter)
    .populate(populate)
    .select(select)
    .sort(sort);
  if (options.session) {
    query.session(options.session);
  }
  return await query.exec();
};

export const findById = async ({
  model,
  id,
  populate = [],
  select = "",
  options = {},
} = {}) => {
  const query = model.findById(id).populate(populate).select(select);
  if (options.session) {
    query.session(options.session);
  }
  return await query.exec();
};

export const find = async ({ model, filter = {}, options = {} } = {}) => {
  const doc = model.find(filter);
  if (options.session) {
    doc.session(options.session);
  }
  if (options.populate) {
    doc.populate(options.populate);
  }
  if (options.skip) {
    doc.skip(options.skip);
  }
  if (options.limit) {
    doc.limit(options.limit);
  }
  if (options.sort) {
    doc.sort(options.sort);
  }
  return await doc.exec();
};

export const findOneAndUpdate = async ({
  model,
  filter = {},
  update = {},
  options = {},
} = {}) => {
  const doc = model.findOneAndUpdate(filter, update, {
    new: true,
    runValidators: true,
    ...options,
  });
  return await doc.exec();
};

export const findOneAndDelete = async ({
  model,
  filter = {},
  options = {},
} = {}) => {
  const doc = model.findOneAndDelete(filter, options);
  return await doc.exec();
};

export const updateOne = async ({
  model,
  filter = {},
  update = {},
  options = {},
} = {}) => {
  const doc = model.updateOne(filter, update, {
    runValidators: true,
    ...options,
  });
  return await doc.exec();
};

export const updateMany = async ({
  model,
  filter = {},
  update = {},
  options = {},
} = {}) => {
  return await model.updateMany(filter, update, {
    runValidators: true,
    ...options,
  });
};

export const deleteMany = async ({ model, filter = {}, options = {} } = {}) => {
  return await model.deleteMany(filter, options);
};
