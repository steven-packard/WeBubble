const localList = require('./lang.json').words;

class Filter {

  constructor(options = {}) {
    Object.assign(this, {
      list: [...localList, ...(options.list || [])],
      exclude: options.exclude || [],
      splitRegex: options.splitRegex || /\b/,
      placeHolder: options.placeHolder || '*',
      regex: options.regex || /[^a-zA-Z0-9|\$|\@]|\^/g,
      replaceRegex: options.replaceRegex || /\w/g
    });
  }

  isProfane(string) {
    return this.list
      .filter((word) => {
        const wordExp = new RegExp(`\\b${word.replace(/(\W)/g, '\\$1')}\\b`, 'gi');
        return !this.exclude.includes(word.toLowerCase()) && wordExp.test(string);
      })
      .length > 0 || false;
  }

  replaceWord(string) {
    return string
      .replace(this.regex, '')
      .replace(this.replaceRegex, this.placeHolder);
  }

  clean(string) {
    return string.split(this.splitRegex).map((word) => {
      return this.isProfane(word) ? this.replaceWord(word) : word;
    }).join(this.splitRegex.exec(string)[0]);
  }

  addWords(...words) {
    this.list.push(...words.map(word => word.toLowerCase()));
    words.forEach((word) => {
      const lowerCaseWord = word.toLowerCase();
      if (this.exclude.includes(lowerCaseWord)) {
        this.exclude.splice(this.exclude.indexOf(lowerCaseWord), 1);
      }
    });
  }

  removeWords(...words) {
    this.exclude.push(...words.map(word => word.toLowerCase()));
  }
}

module.exports = Filter;
