export const THEORY_UNITS = [
  {
    id: "cpu",
    unit: "Unit 1",
    title: "CPU Architecture",
    accent: "#4fb8ff",
    notes: [
      {
        heading: "What is the CPU?",
        body: "The Central Processing Unit (CPU) is the brain of the computer. It carries out instructions from programs by fetching, decoding, and executing them. It contains several key components: the Arithmetic Logic Unit (ALU), the Control Unit (CU), and registers.",
      },
      {
        heading: "Key CPU Components",
        body: "• ALU (Arithmetic Logic Unit) — performs mathematical calculations (+, −, ×, ÷) and logical comparisons (AND, OR, NOT, equal, less than).\n• Control Unit (CU) — manages the flow of data inside the CPU; directs the ALU, registers, and memory.\n• Registers — tiny, ultra-fast storage locations inside the CPU:\n  – Program Counter (PC): holds the address of the next instruction\n  – Accumulator (ACC): holds the result of the last ALU operation\n  – Memory Address Register (MAR): holds the address being read from / written to\n  – Memory Data Register (MDR): holds the data being transferred to/from memory\n  – Current Instruction Register (CIR): holds the instruction currently being decoded\n• Cache — small, very fast memory between the CPU and RAM that stores frequently used data and instructions.",
      },
      {
        heading: "The Fetch-Decode-Execute (FDE) Cycle",
        body: "The CPU continuously repeats three steps:\n\n1. Fetch — The address in the PC is copied to the MAR. The instruction at that address is fetched into the MDR, then copied to the CIR. The PC is incremented by 1.\n2. Decode — The CU decodes the instruction in the CIR to determine what operation is needed.\n3. Execute — The instruction is carried out (e.g. an addition is sent to the ALU, or data is moved to/from memory).",
      },
      {
        heading: "Factors Affecting CPU Performance",
        body: "• Clock speed — measured in GHz. A higher clock speed means more cycles per second, so more instructions can be executed per second.\n• Number of cores — each core can handle a separate thread of instructions. Dual-core = 2 cores, quad-core = 4, etc. More cores helps with multitasking and multi-threaded programs.\n• Cache size — a larger cache means more data is kept close to the CPU, reducing the need to fetch from slower RAM.\n• Word size — the number of bits the CPU can process in one instruction (e.g. 32-bit, 64-bit).",
      },
      {
        heading: "Von Neumann Architecture",
        body: "The most common CPU design. Key principle: instructions and data share the same memory and the same bus. Components: CPU, memory (RAM), input/output devices, and buses (address bus, data bus, control bus).\n\nThe bottleneck problem: because instructions and data share the same bus, they cannot be fetched simultaneously. This is called the Von Neumann bottleneck.",
      },
    ],
    flashcards: [
      { q: "What does CPU stand for?", a: "Central Processing Unit" },
      { q: "What does the ALU do?", a: "Performs arithmetic calculations and logical comparisons" },
      { q: "What does the Control Unit do?", a: "Manages the flow of data within the CPU and controls the ALU, registers, and memory" },
      { q: "What is the Program Counter (PC)?", a: "A register that holds the address of the next instruction to be fetched" },
      { q: "What are the three stages of the FDE cycle?", a: "Fetch, Decode, Execute" },
      { q: "What happens to the Program Counter during the Fetch stage?", a: "It is incremented by 1 so it points to the next instruction" },
      { q: "Name three factors that affect CPU performance.", a: "Clock speed, number of cores, cache size" },
      { q: "What is clock speed measured in?", a: "Gigahertz (GHz)" },
      { q: "What is the Von Neumann bottleneck?", a: "Instructions and data share the same bus, so they cannot be fetched at the same time" },
      { q: "What does the MAR hold?", a: "The memory address currently being read from or written to" },
      { q: "What is cache?", a: "A small, fast memory between the CPU and RAM that stores frequently used data/instructions" },
      { q: "Why does having more CPU cores improve performance?", a: "Each core handles a separate thread, allowing multiple tasks to run simultaneously" },
    ],
  },
  {
    id: "memory",
    unit: "Unit 2",
    title: "Memory & Storage",
    accent: "#a78bfa",
    notes: [
      {
        heading: "RAM vs ROM",
        body: "• RAM (Random Access Memory) — volatile (data is lost when power is off), fast, stores the OS, running applications, and current data. Directly accessible by the CPU.\n• ROM (Read-Only Memory) — non-volatile (data is kept without power), slower to write, stores firmware/BIOS (the startup instructions). Contents are permanent or semi-permanent.",
      },
      {
        heading: "Cache Memory",
        body: "Cache sits between the CPU and RAM. It stores copies of frequently or recently used data so the CPU can access them faster than fetching from RAM every time.\n\nLevels:\n• L1 cache — smallest and fastest, built into the CPU core\n• L2 cache — larger but slightly slower\n• L3 cache — shared between all cores, largest\n\nIf data is found in cache: cache hit (fast). If not: cache miss (data fetched from RAM and added to cache).",
      },
      {
        heading: "Primary vs Secondary Storage",
        body: "• Primary storage — directly accessible by the CPU (RAM, ROM, cache). Fast but expensive and limited in size.\n• Secondary storage — used to store data long-term (hard drives, SSDs, optical discs). Slower but cheap and large.\n\nKey difference: secondary storage is non-volatile; primary storage (RAM) is volatile.",
      },
      {
        heading: "Types of Secondary Storage",
        body: "• Magnetic (HDD) — spinning platters coated in magnetic material. A read/write head moves over the platters. Large capacity, cheap per GB, but mechanical (can fail). Slower than SSD.\n• Solid-State Drive (SSD) — flash memory chips, no moving parts. Faster, lighter, more durable, uses less power, but more expensive per GB.\n• Optical (CD/DVD/Blu-ray) — data stored as pits and lands read by a laser. Portable, cheap, but low capacity. CDs: ~700 MB, DVDs: ~4.7 GB, Blu-ray: ~25 GB.\n• Flash / USB drives — portable solid-state storage, convenient for transferring files.",
      },
      {
        heading: "Measuring Storage",
        body: "• 1 Bit — smallest unit (0 or 1)\n• 1 Byte = 8 bits\n• 1 Kilobyte (KB) = 1,024 bytes\n• 1 Megabyte (MB) = 1,024 KB\n• 1 Gigabyte (GB) = 1,024 MB\n• 1 Terabyte (TB) = 1,024 GB",
      },
    ],
    flashcards: [
      { q: "What does volatile mean?", a: "Data is lost when the power is switched off" },
      { q: "Is RAM volatile or non-volatile?", a: "Volatile" },
      { q: "Is ROM volatile or non-volatile?", a: "Non-volatile" },
      { q: "What is stored in ROM?", a: "The BIOS / firmware — startup instructions" },
      { q: "What is a cache hit?", a: "When the CPU finds the data it needs in cache memory" },
      { q: "Name the three levels of cache.", a: "L1 (fastest, smallest), L2, L3 (slowest of the three, largest, shared)" },
      { q: "What is the main advantage of an SSD over an HDD?", a: "No moving parts, so it is faster, lighter, more durable and uses less power" },
      { q: "How many bytes are in 1 kilobyte?", a: "1,024 bytes" },
      { q: "What type of storage does a USB stick use?", a: "Flash / solid-state memory" },
      { q: "What is the difference between primary and secondary storage?", a: "Primary (RAM/ROM/cache) is directly accessible by the CPU; secondary (HDD/SSD) is for long-term storage" },
    ],
  },
  {
    id: "binary",
    unit: "Unit 3",
    title: "Binary & Data Representation",
    accent: "#34d399",
    notes: [
      {
        heading: "Number Systems",
        body: "• Binary (Base 2) — uses only 0 and 1. Place values: 128, 64, 32, 16, 8, 4, 2, 1.\n• Denary (Base 10) — the normal decimal system (0–9).\n• Hexadecimal (Base 16) — uses 0–9 then A=10, B=11, C=12, D=13, E=14, F=15. One hex digit represents exactly 4 bits (a nibble).\n\nConverting binary → denary: multiply each bit by its place value and add up.\nConverting denary → binary: divide repeatedly by 2, record remainders.\nConverting binary → hex: group bits into nibbles of 4 from the right.",
      },
      {
        heading: "Binary Arithmetic",
        body: "Adding in binary:\n• 0+0 = 0\n• 0+1 = 1\n• 1+1 = 10 (0, carry 1)\n• 1+1+1 = 11 (1, carry 1)\n\nOverflow: occurs when the result of an addition is too large to be stored in the available number of bits. E.g. adding two 8-bit numbers that produce a 9-bit result.",
      },
      {
        heading: "Representing Text",
        body: "Each character is mapped to a number:\n• ASCII (American Standard Code for Information Interchange) — 7-bit, 128 characters. Covers English letters, digits, and punctuation. 'A' = 65, 'a' = 97, '0' = 48.\n• Unicode — extends ASCII to cover all world languages and symbols. UTF-8 uses 1–4 bytes per character. Backward-compatible with ASCII.",
      },
      {
        heading: "Representing Images",
        body: "Images are stored as a grid of pixels. Each pixel stores its colour as a binary number.\n• Colour depth (bit depth) — the number of bits used per pixel. 1-bit = black/white only (2 colours). 8-bit = 256 colours. 24-bit = ~16.7 million colours.\n• Resolution — the total number of pixels (width × height).\n• File size formula: pixels × colour depth (bits) ÷ 8 = bytes\n\nMore pixels + higher colour depth = better quality but larger file size.",
      },
      {
        heading: "Representing Sound",
        body: "Sound is an analogue wave. To store digitally it must be sampled.\n• Sampling — measuring the sound wave at regular intervals.\n• Sample rate — number of samples per second (Hz). Higher = better quality.\n• Bit depth — number of bits per sample. Higher = more detail (dynamic range).\n• File size formula: sample rate × bit depth × duration (seconds) ÷ 8 = bytes\n\nCompression (e.g. MP3) reduces file size by removing data the human ear is less likely to notice.",
      },
    ],
    flashcards: [
      { q: "What is the denary value of binary 1010?", a: "10 (8+2)" },
      { q: "What is the denary value of binary 11111111?", a: "255 (128+64+32+16+8+4+2+1)" },
      { q: "How many hex digits represent one byte?", a: "2 hex digits (each hex digit = 4 bits, 2 × 4 = 8 bits = 1 byte)" },
      { q: "What is overflow in binary arithmetic?", a: "When the result of a calculation is too large to fit in the available number of bits" },
      { q: "What character code is 'A' in ASCII?", a: "65" },
      { q: "Why was Unicode introduced?", a: "ASCII only covers 128 characters (English). Unicode supports all world languages and symbols." },
      { q: "What does 24-bit colour depth mean?", a: "Each pixel uses 24 bits, allowing approximately 16.7 million different colours" },
      { q: "What is sampling rate?", a: "The number of times per second a sound wave is measured (in Hz)" },
      { q: "What is a pixel?", a: "The smallest addressable element in a digital image — a single dot of colour" },
      { q: "What is hex for binary 1100 1010?", a: "CA (1100 = C = 12, 1010 = A = 10)" },
    ],
  },
  {
    id: "networks",
    unit: "Unit 4",
    title: "Networks",
    accent: "#fb923c",
    notes: [
      {
        heading: "LAN vs WAN",
        body: "• LAN (Local Area Network) — covers a small geographic area (a building, school, office). Typically owned and managed by the organisation. Uses Ethernet cables and/or Wi-Fi.\n• WAN (Wide Area Network) — covers large geographic areas (countries, worldwide). The Internet is the world's largest WAN. Uses leased lines, fibre optic cables, and satellite links.",
      },
      {
        heading: "Network Topologies",
        body: "The physical or logical layout of a network:\n• Star topology — all devices connect to a central switch/hub. If the switch fails, the whole network fails. One device failing doesn't affect others. Most common in schools/offices.\n• Bus topology — all devices connect to a single cable (backbone) with terminators at each end. Cheap to set up but slow with many devices; a break in the cable brings down the whole network.\n• Ring topology — devices connect in a circle. Data travels in one direction. Rarely used in modern networks.",
      },
      {
        heading: "Networking Hardware",
        body: "• Router — connects different networks together (e.g. your home network to the Internet). Determines the best path for data.\n• Switch — connects devices within the same LAN. Sends data only to the intended device (unlike a hub which broadcasts to all).\n• Access Point (Wi-Fi) — allows wireless devices to connect to a wired network.\n• NIC (Network Interface Card) — hardware in a device that allows it to connect to a network.",
      },
      {
        heading: "Protocols & the TCP/IP Model",
        body: "A protocol is a set of rules for how data is transmitted.\n• TCP/IP — the foundation of the Internet. Two protocols working together:\n  – IP (Internet Protocol): breaks data into packets and routes them\n  – TCP (Transmission Control Protocol): ensures reliable, ordered delivery; requests resending of lost packets\n• HTTP / HTTPS — rules for web browsers and servers. HTTPS is encrypted (S = Secure).\n• FTP — File Transfer Protocol; used for sending files between computers.\n• SMTP/IMAP/POP3 — email protocols.\n• DNS (Domain Name System) — translates human-readable web addresses (google.com) into IP addresses.",
      },
      {
        heading: "Wired vs Wireless",
        body: "• Wired (Ethernet) — faster, more reliable, more secure, less interference.\n• Wireless (Wi-Fi) — convenient, portable, easier to set up; but slower, more susceptible to interference and interception.\n\nBandwidth — the maximum amount of data that can be transmitted per second (measured in Mbps or Gbps). Higher bandwidth = faster network.",
      },
    ],
    flashcards: [
      { q: "What is the difference between a LAN and a WAN?", a: "A LAN covers a small area (e.g. a school); a WAN covers large areas (e.g. the Internet)" },
      { q: "What is the main disadvantage of a star topology?", a: "If the central switch fails, the whole network stops working" },
      { q: "What does a router do?", a: "Connects different networks together and routes data between them" },
      { q: "What does a switch do?", a: "Connects devices within a LAN and sends data only to the intended recipient" },
      { q: "What is a protocol?", a: "A set of agreed rules for how data is transmitted between devices" },
      { q: "What does DNS stand for and what does it do?", a: "Domain Name System — translates domain names (e.g. google.com) into IP addresses" },
      { q: "What does HTTPS mean and why is it better than HTTP?", a: "HyperText Transfer Protocol Secure — it encrypts the connection, making it safer" },
      { q: "What is bandwidth?", a: "The maximum amount of data that can be transmitted per second, measured in Mbps or Gbps" },
      { q: "What is an IP address?", a: "A unique numerical label assigned to each device on a network, used to identify and locate it" },
      { q: "What is a packet?", a: "A small chunk of data that a message is broken into for transmission across a network" },
    ],
  },
  {
    id: "security",
    unit: "Unit 5",
    title: "Cyber Security",
    accent: "#f87171",
    notes: [
      {
        heading: "Types of Cyber Threats",
        body: "• Malware — malicious software designed to harm a system:\n  – Virus: attaches itself to files and spreads when files are shared\n  – Worm: self-replicates across a network without needing a host file\n  – Trojan: disguises itself as legitimate software\n  – Ransomware: encrypts files and demands payment\n  – Spyware: secretly monitors user activity\n• Phishing — fraudulent emails/messages pretending to be a trusted source to steal credentials.\n• Brute force attack — trying every possible password combination until one works.\n• SQL injection — inserting malicious SQL code into an input field to access or corrupt a database.\n• Denial of Service (DoS) / DDoS — flooding a server with requests to make it unavailable.",
      },
      {
        heading: "Social Engineering",
        body: "Manipulating people rather than systems to gain access or information.\n• Phishing — mass fraudulent emails\n• Spear phishing — targeted attack on a specific person\n• Pretexting — creating a fabricated scenario to trick someone (e.g. pretending to be IT support)\n• Shoulder surfing — watching someone enter their password\n• Baiting — leaving infected USB drives in public places",
      },
      {
        heading: "Defences Against Cyber Attacks",
        body: "• Firewall — monitors incoming and outgoing network traffic and blocks suspicious activity. Can be hardware or software.\n• Antivirus / anti-malware — scans files for known threats and quarantines them.\n• Encryption — converts data into ciphertext so only those with the key can read it. Protects data in transit and at rest.\n• Two-factor authentication (2FA) — requires two forms of identification (e.g. password + SMS code).\n• Strong passwords — long, random, unique passwords for each service.\n• Regular software updates / patches — fix known security vulnerabilities.\n• HTTPS — encrypts web traffic.\n• Access control / least privilege — users only have access to what they need.",
      },
      {
        heading: "Encryption",
        body: "• Symmetric encryption — the same key is used to encrypt and decrypt (fast, but the key must be shared securely).\n• Asymmetric encryption — uses a public key (encrypt) and a private key (decrypt). The public key can be shared openly; only the private key can decrypt.\n• HTTPS uses asymmetric encryption to establish a secure connection, then switches to symmetric for speed.",
      },
    ],
    flashcards: [
      { q: "What is a brute force attack?", a: "Trying every possible combination of characters until the correct password is found" },
      { q: "What is phishing?", a: "A fraudulent attempt to trick someone into revealing sensitive information via fake emails or websites" },
      { q: "What is SQL injection?", a: "Inserting malicious SQL code into an input field to access or manipulate a database" },
      { q: "What does a firewall do?", a: "Monitors network traffic and blocks suspicious or unauthorised communications" },
      { q: "What is the difference between a virus and a worm?", a: "A virus attaches to files and needs a host. A worm self-replicates across a network without a host." },
      { q: "What is ransomware?", a: "Malware that encrypts a victim's files and demands payment (ransom) to restore access" },
      { q: "What is two-factor authentication?", a: "A security method requiring two forms of verification (e.g. password + SMS code)" },
      { q: "What is encryption?", a: "Converting data into a coded form (ciphertext) so only authorised parties with the key can read it" },
      { q: "What is social engineering?", a: "Manipulating people psychologically to gain unauthorised access to systems or information" },
      { q: "What is a DDoS attack?", a: "A Distributed Denial of Service attack — flooding a server from multiple sources to make it unavailable" },
    ],
  },
  {
    id: "algorithms",
    unit: "Unit 6",
    title: "Algorithms & Logic",
    accent: "#fbbf24",
    notes: [
      {
        heading: "What is an Algorithm?",
        body: "A set of step-by-step instructions to solve a problem. A good algorithm is correct, efficient, and clear. Algorithms can be represented as pseudocode or flowcharts.",
      },
      {
        heading: "Sorting Algorithms",
        body: "• Bubble Sort — repeatedly compares adjacent items and swaps them if in wrong order. Repeats until no swaps occur. Simple but slow (O(n²)).\n• Insertion Sort — builds a sorted section one item at a time. Takes each element and inserts it into the correct position in the sorted section. O(n²) worst, O(n) best.\n• Merge Sort — divide and conquer. Splits the list in half repeatedly until lists of 1, then merges them back in order. O(n log n) — more efficient for large lists.",
      },
      {
        heading: "Searching Algorithms",
        body: "• Linear Search — checks each element one by one from the start. Works on unsorted lists. O(n) — slow for large lists.\n• Binary Search — requires a sorted list. Checks the middle element: if too high, search the left half; if too low, search the right half. Repeat. O(log n) — much faster than linear search for large sorted lists.",
      },
      {
        heading: "Boolean Logic",
        body: "Boolean expressions use AND, OR, NOT operators and produce True or False.\n• AND — both inputs must be True: True AND True = True\n• OR — at least one input must be True: True OR False = True\n• NOT — inverts the value: NOT True = False\n• XOR — exactly one input is True: True XOR False = True\n\nLogic gates implement these in hardware. Truth tables list all possible input combinations and their outputs.",
      },
      {
        heading: "Big O Notation (Overview)",
        body: "Big O describes how an algorithm's time or space grows with input size n:\n• O(1) — constant time (doesn't depend on n)\n• O(log n) — logarithmic (binary search)\n• O(n) — linear (linear search)\n• O(n log n) — linearithmic (merge sort)\n• O(n²) — quadratic (bubble sort, insertion sort worst case)",
      },
    ],
    flashcards: [
      { q: "How does bubble sort work?", a: "Repeatedly compares adjacent elements and swaps them if out of order; repeats until no swaps are needed" },
      { q: "What is the time complexity of bubble sort?", a: "O(n²) — quadratic" },
      { q: "Why does binary search require a sorted list?", a: "It works by comparing the target to the middle element and eliminating half the list each time — this only works if the list is ordered" },
      { q: "What is the time complexity of binary search?", a: "O(log n) — logarithmic" },
      { q: "What is the time complexity of linear search?", a: "O(n) — linear" },
      { q: "What does AND produce if one input is False?", a: "False — AND requires both inputs to be True" },
      { q: "What does OR produce if one input is True?", a: "True — OR only needs one True input" },
      { q: "What does NOT do to True?", a: "Returns False (inverts the Boolean value)" },
      { q: "How does merge sort work?", a: "Splits the list in half repeatedly until single elements, then merges them back in sorted order" },
      { q: "What is O(n log n)?", a: "Linearithmic time complexity — typical of efficient sorting algorithms like merge sort" },
    ],
  },
  {
    id: "programming",
    unit: "Unit 7",
    title: "Programming Concepts",
    accent: "#38bdf8",
    notes: [
      {
        heading: "Data Types",
        body: "• Integer (int) — whole numbers: 3, −7, 0\n• Float (float) — decimal numbers: 3.14, −0.5\n• String (str) — text: 'hello', \"Xenon\"\n• Boolean (bool) — True or False\n• Char — a single character (not a separate type in Python; a string of length 1)\n\nCasting (type conversion): int('5') → 5, str(42) → '42', float('3.14') → 3.14",
      },
      {
        heading: "Variables & Constants",
        body: "• Variable — a named location in memory whose value can change.\n• Constant — a value that does not change during execution (Python convention: UPPERCASE).\n\nIn Python:\n```python\nname = 'Alice'     # variable\nPI = 3.14159       # constant (by convention)\n```",
      },
      {
        heading: "Selection (if / elif / else)",
        body: "Allows a program to make decisions:\n```python\nif score >= 70:\n    grade = 'A'\nelif score >= 50:\n    grade = 'B'\nelse:\n    grade = 'C'\n```",
      },
      {
        heading: "Iteration (loops)",
        body: "• For loop — used when the number of iterations is known:\n```python\nfor i in range(5):   # 0, 1, 2, 3, 4\n    print(i)\n```\n• While loop — used when iterations depend on a condition:\n```python\ncount = 0\nwhile count < 5:\n    count += 1\n```",
      },
      {
        heading: "Functions & Scope",
        body: "Functions let you write reusable blocks of code:\n```python\ndef greet(name):\n    return 'Hello, ' + name\n\nresult = greet('Alice')\n```\n• Parameters — inputs to the function.\n• Return value — the output.\n• Scope — local variables exist only inside the function; global variables are accessible everywhere.\n• Recursion — a function that calls itself. Must have a base case to stop.",
      },
      {
        heading: "File Handling & Error Handling",
        body: "Reading and writing files:\n```python\nwith open('data.txt', 'r') as f:\n    content = f.read()\n\nwith open('data.txt', 'w') as f:\n    f.write('Hello')\n```\nModes: 'r' = read, 'w' = write (overwrites), 'a' = append.\n\nError handling with try/except:\n```python\ntry:\n    x = int(input('Enter a number: '))\nexcept ValueError:\n    print('That is not a number!')\n```",
      },
    ],
    flashcards: [
      { q: "What is an integer?", a: "A whole number with no decimal point (e.g. 3, -7, 0)" },
      { q: "What does casting mean?", a: "Converting a value from one data type to another (e.g. int('5') converts the string '5' to the integer 5)" },
      { q: "What is the difference between a variable and a constant?", a: "A variable's value can change; a constant's value stays fixed throughout the program" },
      { q: "When should you use a while loop instead of a for loop?", a: "When you don't know in advance how many iterations are needed (condition-controlled)" },
      { q: "What is a function's return value?", a: "The value the function sends back to the code that called it" },
      { q: "What is scope?", a: "The region of code where a variable can be accessed. Local variables exist only inside a function." },
      { q: "What is recursion?", a: "When a function calls itself. It must have a base case to prevent infinite recursion." },
      { q: "What file mode opens a file for appending?", a: "'a' — adds content to the end without overwriting" },
      { q: "What does try/except do?", a: "Allows the program to catch errors and handle them gracefully instead of crashing" },
      { q: "What does range(1, 6) produce?", a: "The numbers 1, 2, 3, 4, 5 (stops before 6)" },
    ],
  },
  {
    id: "databases",
    unit: "Unit 8",
    title: "Databases & SQL",
    accent: "#c084fc",
    notes: [
      {
        heading: "Relational Databases",
        body: "A relational database stores data in tables (relations). Each table has rows (records) and columns (fields/attributes). Tables are linked using keys.",
      },
      {
        heading: "Keys",
        body: "• Primary Key — a unique identifier for each record in a table. No two rows can have the same primary key. Cannot be NULL.\n• Foreign Key — a field in one table that references the primary key in another table. Creates a relationship between tables.\n• Example: A Students table has student_id (PK). A Submissions table has student_id as a foreign key linking back to the Students table.",
      },
      {
        heading: "SQL — Basic Queries",
        body: "SQL (Structured Query Language) is used to manage and query databases.\n\nSELECT — retrieve data:\n```sql\nSELECT name, age FROM students\nWHERE age > 16\nORDER BY name;\n```\n\nINSERT — add a record:\n```sql\nINSERT INTO students (name, age)\nVALUES ('Alice', 17);\n```\n\nUPDATE — change a record:\n```sql\nUPDATE students\nSET age = 18\nWHERE name = 'Alice';\n```\n\nDELETE — remove a record:\n```sql\nDELETE FROM students\nWHERE name = 'Alice';\n```",
      },
      {
        heading: "SQL JOIN",
        body: "A JOIN combines rows from two tables based on a related column:\n```sql\nSELECT students.name, submissions.grade\nFROM students\nINNER JOIN submissions\nON students.student_id = submissions.student_id;\n```\nINNER JOIN returns only rows where there is a match in both tables.",
      },
      {
        heading: "Normalisation",
        body: "Normalisation organises a database to reduce data redundancy and improve integrity.\n• 1NF — each cell contains one value (no repeating groups); each row is unique.\n• 2NF — in 1NF, and every non-key attribute depends on the whole primary key.\n• 3NF — in 2NF, and no non-key attribute depends on another non-key attribute (no transitive dependencies).\n\nBenefit: reduces duplicate data, makes updates easier and more consistent.",
      },
    ],
    flashcards: [
      { q: "What is a primary key?", a: "A unique identifier for each record in a table; it cannot be NULL or duplicated" },
      { q: "What is a foreign key?", a: "A field in one table that references the primary key in another table, linking the two" },
      { q: "Write a SQL query to select all students older than 16.", a: "SELECT * FROM students WHERE age > 16;" },
      { q: "What does ORDER BY do in SQL?", a: "Sorts the results by a specified column, ascending (ASC) by default" },
      { q: "What does an INNER JOIN do?", a: "Combines rows from two tables where there is a matching value in both tables" },
      { q: "What is normalisation?", a: "The process of organising a database to reduce data redundancy and improve data integrity" },
      { q: "What does 1NF require?", a: "Each cell contains a single value, and each row is unique" },
      { q: "What SQL command is used to add a new record?", a: "INSERT INTO table (columns) VALUES (values);" },
      { q: "What SQL command changes existing data?", a: "UPDATE table SET column = value WHERE condition;" },
      { q: "What does SELECT * mean in SQL?", a: "Select all columns from the table" },
    ],
  },
  {
    id: "ethics",
    unit: "Unit 9",
    title: "Ethics & Society",
    accent: "#2dd4bf",
    notes: [
      {
        heading: "Impact of Technology on Society",
        body: "Positive impacts: improved communication, access to information, automation of dangerous tasks, remote working, telemedicine, education platforms.\n\nNegative impacts: job displacement (automation replacing workers), digital divide (unequal access to technology), privacy concerns, screen addiction, cyberbullying, spread of misinformation.",
      },
      {
        heading: "Privacy & Data Protection (GDPR)",
        body: "GDPR (General Data Protection Regulation) — EU law (2018) that governs how personal data is collected and used.\n\nKey principles:\n• Lawfulness, fairness, and transparency\n• Purpose limitation — data collected for specific purposes only\n• Data minimisation — only collect what is necessary\n• Accuracy — keep data up to date\n• Storage limitation — don't keep data longer than needed\n• Integrity and confidentiality — keep data secure\n\nRights of individuals: right to access, right to erasure ('right to be forgotten'), right to data portability.",
      },
      {
        heading: "Open Source vs Proprietary Software",
        body: "• Open source — source code is publicly available. Anyone can view, modify, and distribute. Examples: Linux, Python, Firefox. Advantages: free, community-supported, transparent, customisable.\n• Proprietary (closed source) — source code is private. Users pay for a licence. Examples: Windows, Microsoft Office. Advantages: dedicated support, often polished UX, regular updates.\n\nKey exam point: open source does NOT always mean free of cost, though it often is.",
      },
      {
        heading: "Environmental Impact of Computing",
        body: "• Energy consumption — data centres consume massive amounts of electricity; manufacturing devices requires energy and raw materials.\n• E-waste — discarded electronics contain toxic materials (lead, mercury). Should be recycled properly.\n• Carbon footprint — streaming, cloud computing, and cryptocurrency mining all produce CO₂.\n• Green computing — efforts to reduce energy use: efficient processors, renewable energy, device recycling, cloud consolidation.",
      },
      {
        heading: "Artificial Intelligence & Ethics",
        body: "• Bias in AI — algorithms trained on biased data produce biased outcomes (e.g. facial recognition performing worse on darker skin tones).\n• Autonomy — who is responsible when an autonomous system causes harm (self-driving car accident)?\n• Surveillance — AI-powered surveillance raises privacy concerns.\n• Job displacement — AI and robotics may make many jobs redundant.\n• Deepfakes — AI-generated fake videos that can spread misinformation.",
      },
    ],
    flashcards: [
      { q: "What does GDPR stand for?", a: "General Data Protection Regulation" },
      { q: "What is the 'right to be forgotten'?", a: "The right of individuals to request that their personal data be deleted" },
      { q: "What is the digital divide?", a: "The gap between those who have access to technology and the internet and those who do not" },
      { q: "What is open source software?", a: "Software whose source code is publicly available for anyone to view, modify, and distribute" },
      { q: "Give one advantage of open source software.", a: "Free to use, community-supported, transparent, and customisable" },
      { q: "Give one advantage of proprietary software.", a: "Dedicated support, polished user experience, and regular official updates" },
      { q: "What is e-waste?", a: "Discarded electronic devices that can contain toxic materials and must be recycled properly" },
      { q: "What is algorithmic bias?", a: "When an AI system produces unfair outcomes because it was trained on biased data" },
      { q: "Name two negative impacts of technology on society.", a: "Job displacement, digital divide, privacy erosion, cyberbullying, misinformation — any two" },
      { q: "What is a deepfake?", a: "An AI-generated fake video or image that makes someone appear to say or do something they did not" },
    ],
  },
];
