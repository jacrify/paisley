export const stringOperators = {
  contains: {
    label: "contains",
    operator: 'contains',
    short: '',
    default: true
  },
  notcontains: {
    label: "does not contain",
    operator: 'not_contains',
    short: "not"
  },
  regex: {
    label: "matches regex",
    operator: 'regex',
    short: '',
    formatValue: (value) => `/${value}/i`
  },
  notregex: {
    label: "does not match regex",
    operator: 'not_regex',
    short: 'not',
    formatValue: (value) => `/${value}/i`
  },
  matchword: {
    label: "matches word",
    operator: 'regex',
    short: '',
    formatValue: (value) => `/\\b${value}\\b/i`
  },
  blank: {
    label: "is blank",
    operator: 'empty',
    operatorOnly: true,
  },
  notblank: {
    label: "is not blank",
    operator: 'not_empty',
    short: "not blank",
    operatorOnly: true,
  },
  edited: {
    label: "is edited",
    operator: 'edited',
    operatorOnly: true,
  },
}

export const lookupOperators = {
  is: {
    label: "is",
    operator: 'in',
    short: ''
  },
  anyof: {
    label: "is any of",
    operator: 'in',
    short: '',
    default: true
  },
  notanyof: {
    label: "is not any of",
    operator: 'not_in',
    short: 'not'
  },
  blank: {
    label: "is blank",
    operator: 'empty',
    operatorOnly: true,
  },
  notblank: {
    label: "is not blank",
    operator: 'not_empty',
    operatorOnly: true,
  }
}

export const dateOperators = {
  after: {
    label: 'On or after',
    operator: '>=',
    short: '>'
  },
  before: {
    label: 'On or before',
    operator: '<=',
    short: '<'
  }
}

export const numberOperators = {
  abs_equals: {
    label: "equals",
    operator: 'abs=',
    short: '',
    default: true
  },
  abs_gt: {
    label: "greater than",
    operator: 'abs>',
    short: '>',
  },
  abs_lt: {
    label: "less than",
    operator: 'abs<',
    short: '<',
  },
  between: {
    label: "between",
    operator: '',
    short: '',
  }
}

export function filterExpression(field, operatorDefinition, value) {
  return {
    field,
    operatorDefinition,
    value
  };
}

export function defaultOperator(operators) {
  for (const operatorId of Object.keys(operators)) {
    const operatorDef = operators[operatorId];
    if ('default' in operatorDef) {
      return operatorId;
    }
  }

  return Object.keys(operators)[0];
}