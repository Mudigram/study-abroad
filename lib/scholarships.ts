export interface Scholarship {
  id: string;
  name: string;
  description: string;
  country: string;
  degreeLevel: "Bachelor's" | "Master's" | "PhD" | "All";
  universityName: string;
  programName: string;
  fundingType: string;
  templateSearchName: string;
}

export const PREMIUM_SCHOLARSHIPS: Scholarship[] = [
  {
    id: "stipendium_hungaricum",
    name: "Stipendium Hungaricum Scholarship",
    description: "Fully funded Hungarian government scholarship covering tuition, stipend, accommodation support, and medical insurance.",
    country: "Hungary",
    degreeLevel: "Master's",
    universityName: "Budapest University of Technology and Economics",
    programName: "MSc in Computer Science / Computational Biology",
    fundingType: "100% Tuition, Monthly Stipend, Housing, Health Insurance",
    templateSearchName: "Stipendium Hungaricum",
  },
  {
    id: "daad_epos",
    name: "DAAD EPOS Scholarship",
    description: "German Academic Exchange Service fully funded scholarship targeting postgraduate development-related courses.",
    country: "Germany",
    degreeLevel: "Master's",
    universityName: "Technical University of Munich",
    programName: "MSc in Sustainable Resource Management / Informatics",
    fundingType: "100% Tuition, €934/Month Stipend, Travel Allowance, Health Cover",
    templateSearchName: "Germany",
  },
  {
    id: "erasmus_mundus",
    name: "Erasmus Mundus Joint Masters",
    description: "Prestigious fully funded master programs taught jointly by a consortium of European universities.",
    country: "Europe",
    degreeLevel: "Master's",
    universityName: "Consortium of European Universities",
    programName: "Joint MSc in Decentralized Smart Energy Systems",
    fundingType: "100% Tuition, €1,400/Month Stipend, Full Travel + Relocation Cover",
    templateSearchName: "Stipendium Hungaricum", // General default
  },
  {
    id: "chevening",
    name: "Chevening Scholarship",
    description: "UK Government's global scholarship program funding one-year master's degrees for future leaders.",
    country: "UK",
    degreeLevel: "Master's",
    universityName: "University of Oxford",
    programName: "MSc in Public Policy / Advanced Computer Science",
    fundingType: "100% Tuition, Monthly Living Allowance, Flight Tickets to/from UK",
    templateSearchName: "Stipendium Hungaricum", // General default
  },
];
