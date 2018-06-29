'use strict';

//      

/**
 * We want to represent each subs. type as minimally as possible,
 * so instead of using strings we just use characters, which lets us
 * represent 27 individual subs. using a single character each.
 */

var UserText = 'a';
var FullMonth = 'b';
var PartialMonth = 'c';
var FullYear = 'd';
var PartialYear = 'e';
var DayOfTheWeek = 'f';
var Hour = 'g';
var Minutes = 'h';
var Seconds = 'i';
var PostOrAnteMeridiem = 'j';
var Day = 'k';
var DayOfTheMonth = 'l';
var NumberMonth = 'n';
var Hour24 = 'm';

var SubToTypeIdentifierMap = {
  'MMMM': FullMonth,
  'MM': PartialMonth,
  'Mo': NumberMonth,
  'YYYY': FullYear,
  'YY': PartialYear,
  'dddd': DayOfTheWeek,
  'DD': DayOfTheMonth,
  'Do': Day,
  'h': Hour,
  'H': Hour24,
  'mm': Minutes,
  'ss': Seconds,
  'a': PostOrAnteMeridiem
};

//      

/**
 * These types help ensure we don't misspell them anywhere. They will be
 * removed during build.
 */

var months = ["January", "Febuary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Takes an integer and returns a string left padded with
 * a zero to the left. Used to display minutes and hours (1:01:00PM);
 */
function paddWithZeros(int) {
  return int < 10 ? '0' + int : '' + int;
}

/**
 * Adds suffix to day, so 16 becomes 16th.
 */
function suffix(int) {
  return int % 10 == 1 && int != 11 ? int + "st" : int % 10 == 2 && int != 12 ? int + "nd" : int % 10 == 3 && int != 13 ? int + "rd" : int + "th";
}

/**
 * The compiler takes in our array of tokens returned from the parser
 * and returns the formed template. It just iterates over the tokens and
 * appends some text to the returned string depending on the type of token.
 * @param {Array<Tokens>} tokens
 * @param {Date} date
 * @param {TinyTimeOptions} options
 * @returns {String}
 */
function compiler(tokens, date, options) {
  var month = date.getMonth();
  var year = date.getFullYear();
  var hours = date.getHours();
  var seconds = date.getSeconds();
  var minutes = date.getMinutes();
  var day = date.getDate();
  var compiled = '';
  var index = 0;
  while (index < tokens.length) {
    var token = tokens[index];
    switch (token.t) {
      case UserText:
        // $FlowFixMe flow doesn't know that v is always populated on UserText
        compiled += token.v;
        break;
      case Day:
        compiled += suffix(day);
        break;
      case PartialMonth:
        compiled += months[month].slice(0, 3);
        break;
      case FullMonth:
        compiled += months[month];
        break;
      case NumberMonth:
        var mnth = month + 1;
        if (options.padMonth) {
          mnth = paddWithZeros(mnth);
        }
        compiled += mnth;
        break;
      case FullYear:
        compiled += year;
        break;
      case PartialYear:
        compiled += (year + '').slice(2);
        break;
      case DayOfTheWeek:
        compiled += days[date.getDay()];
        break;
      case DayOfTheMonth:
        compiled += options.padDays ? paddWithZeros(day) : day;
        break;
      case Hour:
        var hour = hours === 0 || hours === 12 ? 12 : hours % 12;
        if (options.padHours) {
          hour = paddWithZeros(hour);
        }
        compiled += hour;
        break;
      case Hour24:
        var hour24 = hours;
        if (options.padHours) {
          hour24 = paddWithZeros(hour24);
        }
        compiled += hour24;
        break;
      case Minutes:
        compiled += paddWithZeros(minutes);
        break;
      case Seconds:
        compiled += paddWithZeros(seconds);
        break;
      case PostOrAnteMeridiem:
        compiled += hours >= 12 ? 'PM' : 'AM';
        break;
    }
    index++;
  }
  return compiled;
}

//      
/**
 * t is type and v is value. Minified property
 * names are being used because the current minification
 * step does not mangle property names, and we want to
 * reduce bundle size as much as possible.
 */

/**
 * Rather than using a bunch of potentially confusing regular
 * expressions to match patterns in templates, we use a simple
 * parser, taking the aproach of a compiler. This is equivalent
 * to a lexer as it returns a stream of tokens. Since there is
 * no additional analysis required for semantics we just call
 * it a parser.
 * 
 * It will return an array of tokens, each corresponding to either
 * UserText (just text we want to render) or any number of the
 * subsitution types stored in SubToTypeIdentifierMap.
 * 
 */
function parser(template) {
  var tokens = [];
  /**
   * We iterate through each character in the template string, and track
   * the index of the character we're processing with `position`. We start
   * at 0, the first character.
   */
  var position = 0;
  /**
   * `text` is used to accumulate what we call "UserText", or simply text that
   * is not a subsitution. For example, in the template:
   *  
   *  "The day is {day}."
   * 
   * There are two instances of `UserText`, "The day is " and ".", which is the text
   * befor eand after the subsitution. With this template our tokens would look something like:
   * 
   * [
   *  { type: UserText, value: "The day is "},
   *  { type : DaySub },
   *  { type: UserText, value: "." }
   * ]
   * 
   */
  var text = '';
  while (position < template.length) {
    var char = template[position++];
    /**
     * A bracket indicates we're starting a subsitution. Any characters after this,
     * and before the next '}' will be considered part of the subsitution name.
     */
    if (char === '{') {
      // Push any `UserText` we've accumulated and reset the `text` variable.
      if (text) {
        tokens.push({
          t: UserText,
          v: text
        });
      }
      text = '';
      var sub = '';
      char = template[position++];
      while (char !== '}') {
        sub += char;
        char = template[position++];
      }
      tokens.push({
        t: SubToTypeIdentifierMap[sub]
      });
    }
    // Anything not inside brackets is just plain text.
    else {
        text += char;
      }
  }
  /**
   * We might have some text after we're done iterating through the template if
   * the template ends with some `UserText`.
   */
  if (text) {
    tokens.push({
      t: UserText,
      v: text
    });
  }
  return tokens;
}

//      
function tinytime(template) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var templateAST = parser(template);
  return {
    render: function render(date) {
      return compiler(templateAST, date, options);
    }
  };
}

module.exports = tinytime;
//# sourceMappingURL=tinytime.js.map
