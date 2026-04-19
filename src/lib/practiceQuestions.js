const joinLines = (values) => values.map((value) => String(value)).join("\n");

const factorial = (n) => {
  let result = 1;
  for (let value = 2; value <= n; value += 1) result *= value;
  return result;
};

const countVowels = (word) => (word.match(/[aeiou]/gi) || []).length;

const countsForSentence = (sentence) => {
  const result = {};
  sentence.split(" ").forEach((word) => {
    result[word] = (result[word] || 0) + 1;
  });
  return JSON.stringify(result).replace(/"/g, "'");
};

const buildRange = (length, mapper) => Array.from({ length }, (_, index) => mapper(index));

const greetingNames = ["Ava", "Luca", "Mia", "Noah", "Zara", "Eli", "Ruby", "Owen", "Maya", "Leo", "Ivy", "Jude", "Nina", "Kai", "Lila", "Finn", "Aria", "Hugo", "Esme", "Milo", "Layla", "Reid", "Sara", "Theo", "Poppy", "Alex", "Bella", "Callum", "Daisy", "Mason"];
const vowelWords = ["banana", "education", "xylophone", "computer", "science", "iteration", "algorithm", "umbrella", "isolate", "equation", "operator", "elephant", "aviation", "coding", "teacher", "student", "python", "variable", "function", "condition", "network", "internet", "database", "revision", "practice", "academy", "notebook", "sequence", "holiday", "adventure"];
const reverseWords = ["school", "python", "coding", "student", "teacher", "science", "project", "browser", "network", "database", "monitor", "algorithm", "variable", "function", "sequence", "selection", "iteration", "homework", "progress", "profile", "friends", "library", "thunder", "rainbow", "sunrise"];
const passwordSeeds = ["code1234", "securepass", "tinypass", "revision9", "schoolday", "logicloop", "friendzone", "classroom", "practice1", "homework7", "database2", "thinking8", "pythonfun", "rankings9", "starlight", "sunflower", "debugging", "progress5", "keyboard1", "monitor22", "learning3", "functions", "internet4", "variable5", "coderlife"];
const namePairs = [["Grace Hopper", "GH"], ["Alan Turing", "AT"], ["Ada Lovelace", "AL"], ["Margaret Hamilton", "MH"], ["Tim Berners", "TB"], ["Katherine Johnson", "KJ"], ["Dorothy Vaughan", "DV"], ["Radia Perlman", "RP"], ["Hedy Lamarr", "HL"], ["Mary Jackson", "MJ"], ["John Backus", "JB"], ["Barbara Liskov", "BL"], ["Donald Knuth", "DK"], ["George Boole", "GB"], ["Carol Shaw", "CS"], ["Sophie Wilson", "SW"], ["Steve Wozniak", "SW"], ["Larry Page", "LP"], ["Linus Torvalds", "LT"], ["Anita Borg", "AB"], ["Cynthia Breazeal", "CB"], ["Edsger Dijkstra", "ED"], ["Guido Rossum", "GR"], ["James Gosling", "JG"], ["Bjarne Stroustrup", "BS"]];
const frequencySentences = [
  "code code class",
  "debug test debug run",
  "learn python learn",
  "loop loop loop stop",
  "school code school code",
  "friend class friend club",
  "practice makes practice",
  "logic puzzle logic answer",
  "input output input",
  "read write read write",
  "save run save",
  "level boss level",
  "rank climb rank",
  "quiz win quiz",
  "focus learn focus",
  "team team project",
  "skill build skill build",
  "data code data",
  "class note class note",
  "goal plan goal",
  "test score test",
  "graph plot graph",
  "binary bit binary",
  "array list array",
  "web page web"
];

const questionFamilies = [
  ...greetingNames.map((name, index) => ({
    title: `Greeting Printer ${index + 1}`,
    difficulty: "Easy",
    topic: "Output",
    description: `Print a greeting for ${name}.`,
    output: `Hello, ${name}`,
    lines: [`name = '${name}'`, "print('Hello,', name)"],
  })),
  ...buildRange(30, (index) => {
    const number = index + 2;
    const limit = 5 + (index % 2);
    return {
      title: `Times Table ${index + 1}`,
      difficulty: "Easy",
      topic: "Iteration",
      description: `Print the ${number} times table from 1 to ${limit}.`,
      output: joinLines(Array.from({ length: limit }, (_, step) => number * (step + 1))),
      lines: [
        `for i in range(1, ${limit + 1}):`,
        `    print(${number} * i)`,
      ],
    };
  }),
  ...buildRange(30, (index) => {
    const start = index + 1;
    const stop = start + 4;
    const values = Array.from({ length: 4 }, (_, offset) => start + offset);
    return {
      title: `Even Or Odd ${index + 1}`,
      difficulty: "Easy",
      topic: "Selection",
      description: `Check whether the numbers from ${start} to ${stop - 1} are even or odd.`,
      output: joinLines(values.map((value) => `${value % 2 === 0 ? "even" : "odd"} ${value}`)),
      lines: [
        `for n in range(${start}, ${stop}):`,
        "    if n % 2 == 0:",
        "        print('even', n)",
        "    else:",
        "        print('odd', n)",
      ],
    };
  }),
  ...buildRange(30, (index) => {
    const values = [index + 2, index + 5, index + 8, index + 11];
    return {
      title: `List Sum ${index + 1}`,
      difficulty: "Easy",
      topic: "Lists",
      description: "Add every number in a list using a running total.",
      output: String(values.reduce((total, value) => total + value, 0)),
      lines: [
        `numbers = [${values.join(", ")}]`,
        "total = 0",
        "for number in numbers:",
        "    total += number",
        "print(total)",
      ],
    };
  }),
  ...buildRange(30, (index) => {
    const values = [index + 9, index + 3, index + 14, index + 6];
    return {
      title: `Largest Value ${index + 1}`,
      difficulty: "Easy",
      topic: "Lists",
      description: "Find the largest number in a list.",
      output: String(Math.max(...values)),
      lines: [
        `values = [${values.join(", ")}]`,
        "largest = values[0]",
        "for value in values:",
        "    if value > largest:",
        "        largest = value",
        "print(largest)",
      ],
    };
  }),
  ...vowelWords.map((word, index) => ({
    title: `Vowel Counter ${index + 1}`,
    difficulty: "Easy",
    topic: "Strings",
    description: `Count the vowels in "${word}".`,
    output: String(countVowels(word)),
    lines: [
      `text = '${word}'`,
      "count = 0",
      "for ch in text:",
      "    if ch in 'aeiou':",
      "        count += 1",
      "print(count)",
    ],
  })),
  ...reverseWords.map((word, index) => ({
    title: `Reverse Word ${index + 1}`,
    difficulty: "Easy",
    topic: "Strings",
    description: `Reverse the word "${word}" using slice notation.`,
    output: word.split("").reverse().join(""),
    lines: [
      `text = '${word}'`,
      "reversed_text = text[::-1]",
      "print(reversed_text)",
    ],
  })),
  ...buildRange(25, (index) => {
    const score = 35 + index * 2;
    const grade = score >= 80 ? "A" : score >= 60 ? "B" : "C";
    return {
      title: `Grade Classifier ${index + 1}`,
      difficulty: "Easy",
      topic: "Selection",
      description: `Classify a score of ${score} into grade A, B, or C.`,
      output: grade,
      lines: [
        `score = ${score}`,
        "if score >= 80:",
        "    print('A')",
        "elif score >= 60:",
        "    print('B')",
        "else:",
        "    print('C')",
      ],
    };
  }),
  ...passwordSeeds.map((password, index) => ({
    title: `Password Check ${index + 1}`,
    difficulty: "Easy",
    topic: "Selection",
    description: `Check whether "${password}" is at least eight characters long.`,
    output: password.length >= 8 ? "strong enough" : "too short",
    lines: [
      `password = '${password}'`,
      "if len(password) >= 8:",
      "    print('strong enough')",
      "else:",
      "    print('too short')",
    ],
  })),
  ...buildRange(25, (index) => {
    const values = [index + 1, index + 2, index + 3, index + 4, index + 5, index + 6];
    return {
      title: `Filter Evens ${index + 1}`,
      difficulty: "Medium",
      topic: "Lists",
      description: "Build a new list containing only the even values.",
      output: `[${values.filter((value) => value % 2 === 0).join(", ")}]`,
      lines: [
        `numbers = [${values.join(", ")}]`,
        "evens = []",
        "for n in numbers:",
        "    if n % 2 == 0:",
        "        evens.append(n)",
        "print(evens)",
      ],
    };
  }),
  ...buildRange(25, (index) => {
    const values = [index + 4, index + 6, index + 8, index + 10];
    const average = values.reduce((total, value) => total + value, 0) / values.length;
    return {
      title: `Average Calculator ${index + 1}`,
      difficulty: "Medium",
      topic: "Lists",
      description: "Calculate the average of a list of numbers.",
      output: String(average),
      lines: [
        `numbers = [${values.join(", ")}]`,
        "total = sum(numbers)",
        "average = total / len(numbers)",
        "print(average)",
      ],
    };
  }),
  ...buildRange(25, (index) => {
    const word = reverseWords[index];
    const letter = word[index % word.length];
    const count = word.split("").filter((char) => char === letter).length;
    return {
      title: `Character Count ${index + 1}`,
      difficulty: "Medium",
      topic: "Strings",
      description: `Count how many times "${letter}" appears in "${word}".`,
      output: String(count),
      lines: [
        `word = '${word}'`,
        `target = '${letter}'`,
        "count = 0",
        "for char in word:",
        "    if char == target:",
        "        count += 1",
        "print(count)",
      ],
    };
  }),
  ...buildRange(25, (index) => {
    const start = index + 4;
    const values = Array.from({ length: 4 }, (_, offset) => start - offset);
    return {
      title: `Countdown While ${index + 1}`,
      difficulty: "Medium",
      topic: "Iteration",
      description: `Count down from ${start} to 1 with a while loop.`,
      output: joinLines(values),
      lines: [
        `count = ${start}`,
        "while count > 0:",
        "    print(count)",
        "    count -= 1",
      ],
    };
  }),
  ...buildRange(25, (index) => {
    const number = (index % 5) + 4;
    const sequence = [0, 1];
    while (sequence.length < number) {
      sequence.push(sequence.at(-1) + sequence.at(-2));
    }
    const output = `[${sequence.slice(0, number).join(", ")}]`;
    return {
      title: `Fibonacci Builder ${index + 1}`,
      difficulty: "Medium",
      topic: "Iteration",
      description: `Generate the first ${number} Fibonacci values.`,
      output,
      lines: [
        "sequence = [0, 1]",
        `while len(sequence) < ${number}:`,
        "    sequence.append(sequence[-1] + sequence[-2])",
        `print(sequence[:${number}])`,
      ],
    };
  }),
  ...buildRange(25, (index) => {
    const number = (index % 5) + 3;
    return {
      title: `Factorial Builder ${index + 1}`,
      difficulty: "Medium",
      topic: "Iteration",
      description: `Calculate ${number}! using a loop.`,
      output: String(factorial(number)),
      lines: [
        `number = ${number}`,
        "result = 1",
        "for value in range(1, number + 1):",
        "    result *= value",
        "print(result)",
      ],
    };
  }),
  ...buildRange(25, (index) => {
    const celsius = index + 5;
    const fahrenheit = celsius * 9 / 5 + 32;
    return {
      title: `Temperature Convert ${index + 1}`,
      difficulty: "Easy",
      topic: "Arithmetic",
      description: `Convert ${celsius}C into Fahrenheit.`,
      output: String(fahrenheit),
      lines: [
        `celsius = ${celsius}`,
        "fahrenheit = celsius * 9 / 5 + 32",
        "print(fahrenheit)",
      ],
    };
  }),
  ...namePairs.map(([fullName, initials], index) => ({
    title: `Initials Builder ${index + 1}`,
    difficulty: "Medium",
    topic: "Strings",
    description: `Create the initials for ${fullName}.`,
    output: initials,
    lines: [
      `full_name = '${fullName}'`,
      "parts = full_name.split()",
      "initials = parts[0][0] + parts[1][0]",
      "print(initials)",
    ],
  })),
  ...buildRange(25, (index) => {
    const scores = {
      Amy: 70 + (index % 5),
      Ben: 76 + (index % 4),
      Cara: 82 + (index % 3),
    };
    const lookup = index % 2 === 0 ? "Ben" : "Cara";
    return {
      title: `Dictionary Lookup ${index + 1}`,
      difficulty: "Medium",
      topic: "Dictionaries",
      description: `Read ${lookup}'s score from a dictionary.`,
      output: String(scores[lookup]),
      lines: [
        `scores = {'Amy': ${scores.Amy}, 'Ben': ${scores.Ben}, 'Cara': ${scores.Cara}}`,
        `student = '${lookup}'`,
        "print(scores[student])",
      ],
    };
  }),
  ...frequencySentences.map((sentence, index) => ({
    title: `Word Frequency ${index + 1}`,
    difficulty: "Hard",
    topic: "Dictionaries",
    description: `Count repeated words in "${sentence}".`,
    output: countsForSentence(sentence),
    lines: [
      `words = '${sentence}'.split()`,
      "counts = {}",
      "for word in words:",
      "    if word in counts:",
      "        counts[word] += 1",
      "    else:",
      "        counts[word] = 1",
      "print(counts)",
    ],
  })),
  ...buildRange(25, (index) => {
    const size = index % 2 === 0 ? 2 : 3;
    const output = Array.from({ length: size }, (_, row) =>
      Array.from({ length: size }, (_, col) => `${row},${col}`).join("  "),
    ).join("\n");
    return {
      title: `Grid Coordinates ${index + 1}`,
      difficulty: "Hard",
      topic: "Iteration",
      description: `Use nested loops to print a ${size}x${size} grid of coordinates.`,
      output,
      lines: [
        `for row in range(${size}):`,
        `    for col in range(${size}):`,
        "        print(row, col, end='  ')",
        "    print()",
      ],
    };
  }),
];

export const PRACTICE_QUESTIONS = questionFamilies;
