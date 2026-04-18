import { motion } from "framer-motion";

const TOPICS = [
  {
    unit: "Unit 1",
    title: "CPU Architecture",
    items: ["The Fetch-Decode-Execute cycle", "Registers, ALU, and Control Unit", "Factors affecting CPU performance", "Von Neumann architecture"],
  },
  {
    unit: "Unit 2",
    title: "Memory & Storage",
    items: ["RAM vs ROM", "Cache memory and its role", "Primary vs secondary storage", "Magnetic, optical, and solid-state storage"],
  },
  {
    unit: "Unit 3",
    title: "Binary & Data Representation",
    items: ["Binary, denary, and hexadecimal", "Binary arithmetic and overflow", "Representing text with ASCII and Unicode", "Representing images and sound"],
  },
  {
    unit: "Unit 4",
    title: "Networks",
    items: ["LAN vs WAN", "Network topologies", "TCP/IP and the OSI model", "Wi-Fi, Ethernet, and protocols"],
  },
  {
    unit: "Unit 5",
    title: "Cyber Security",
    items: ["Common threats: malware, phishing, brute force", "Encryption and authentication", "Firewalls and network security", "Social engineering"],
  },
  {
    unit: "Unit 6",
    title: "Algorithms & Logic",
    items: ["Sorting algorithms: bubble, merge, insertion", "Searching: linear and binary", "Boolean logic and truth tables", "Flowcharts and pseudocode"],
  },
  {
    unit: "Unit 7",
    title: "Programming Concepts",
    items: ["Variables, data types, and casting", "Selection, iteration, and recursion", "Functions and scope", "File handling and error handling"],
  },
  {
    unit: "Unit 8",
    title: "Databases & SQL",
    items: ["Relational databases and tables", "Primary and foreign keys", "Basic SQL: SELECT, WHERE, JOIN", "Normalisation"],
  },
  {
    unit: "Unit 9",
    title: "Ethics & Society",
    items: ["Impact of technology on society", "Privacy and data protection (GDPR)", "Open source vs proprietary software", "Environmental impact of computing"],
  },
];

export default function TheoryComingSoon() {
  return (
    <motion.section className="space-y-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="xenon-panel p-6 sm:p-8">
        <span className="xenon-pill">GCSE Computer Science Theory</span>
        <h2 className="xenon-section-title mt-5 font-bold">Theory revision is coming soon.</h2>
        <p className="xenon-subtitle mt-4 max-w-2xl text-sm sm:text-base">
          This section will cover all the key GCSE Computer Science theory topics — from CPU architecture and binary representation to networks, cyber security, and ethics. Each topic will include clear explanations, worked examples, and short revision checks.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="xenon-badge">AQA</span>
          <span className="xenon-badge">OCR</span>
          <span className="xenon-badge">Edexcel</span>
          <span className="xenon-badge">9 units planned</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TOPICS.map((topic) => (
          <div key={topic.title} className="xenon-panel p-5">
            <p className="xenon-kicker">{topic.unit} — Coming Soon</p>
            <h3 className="mt-2 text-lg font-semibold">{topic.title}</h3>
            <ul className="mt-3 space-y-1">
              {topic.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                  <span className="mt-0.5 shrink-0 text-[var(--accent)]">–</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="xenon-panel p-6">
        <p className="xenon-kicker">In Development</p>
        <h3 className="mt-2 text-lg font-semibold">What to expect when Theory launches</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="xenon-panel-muted p-4">
            <p className="font-semibold">Clear Notes</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Concise, exam-focused explanations for every topic, written to match the GCSE specification.</p>
          </div>
          <div className="xenon-panel-muted p-4">
            <p className="font-semibold">Worked Examples</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Step-by-step walkthroughs of common exam questions such as binary conversion and CPU cycles.</p>
          </div>
          <div className="xenon-panel-muted p-4">
            <p className="font-semibold">Quick Revision Checks</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Short recall questions at the end of each topic to check understanding before a test.</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
