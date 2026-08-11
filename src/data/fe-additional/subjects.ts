import type { FESubject } from "@/types/fe";

// Additional FE discipline catalogs. Ranges are planning weights from the public NCEES
// specification framework and should be checked whenever NCEES publishes revisions.
export const feElectricalComputerSubjects: FESubject[] = [
  { id: "math", order: 1, title: "Mathematics", examQuestionRange: [11, 17], sections: [
    { id: "algebra-trig", title: "Algebra and Trigonometry" },
    { id: "calculus", title: "Calculus" },
    { id: "differential-equations", title: "Differential Equations" },
    { id: "linear-algebra", title: "Linear Algebra" },
    { id: "discrete-math", title: "Discrete Mathematics" },
  ] },
  { id: "probability-statistics", order: 2, title: "Probability and Statistics", examQuestionRange: [4, 6], sections: [
    { id: "probability", title: "Probability Distributions" },
    { id: "statistics", title: "Statistics" },
    { id: "reliability", title: "Reliability" },
  ] },
  { id: "ethics", order: 3, title: "Ethics and Professional Practice", examQuestionRange: [4, 6], sections: [
    { id: "codes", title: "Codes of Ethics" },
    { id: "licensure", title: "Licensure and Professional Responsibility" },
  ] },
  { id: "engineering-economics", order: 4, title: "Engineering Economics", examQuestionRange: [4, 6], sections: [
    { id: "time-value", title: "Time Value of Money" },
    { id: "cost-analysis", title: "Cost and Economic Analysis" },
  ] },
  { id: "properties-materials", order: 5, title: "Properties of Electrical Materials", examQuestionRange: [4, 6], sections: [
    { id: "conductors", title: "Conductors, Semiconductors, and Insulators" },
    { id: "magnetic-materials", title: "Magnetic Materials" },
  ] },
  { id: "circuits", order: 6, title: "Circuit Analysis", examQuestionRange: [10, 15], sections: [
    { id: "dc-circuits", title: "DC Circuits" },
    { id: "ac-circuits", title: "AC Circuits" },
    { id: "transient-response", title: "Transient Response" },
    { id: "frequency-response", title: "Frequency Response" },
  ] },
  { id: "linear-systems", order: 7, title: "Linear Systems", examQuestionRange: [5, 8], sections: [
    { id: "signals", title: "Signals and Systems" },
    { id: "transforms", title: "Laplace, Fourier, and Z Transforms" },
  ] },
  { id: "signal-processing", order: 8, title: "Signal Processing", examQuestionRange: [5, 8], sections: [
    { id: "sampling", title: "Sampling" },
    { id: "filters", title: "Analog and Digital Filters" },
  ] },
  { id: "electronics", order: 9, title: "Electronics", examQuestionRange: [7, 11], sections: [
    { id: "diodes", title: "Diodes" },
    { id: "transistors", title: "Transistors" },
    { id: "op-amps", title: "Operational Amplifiers" },
  ] },
  { id: "power", order: 10, title: "Power", examQuestionRange: [8, 12], sections: [
    { id: "single-three-phase", title: "Single-Phase and Three-Phase Power" },
    { id: "transformers", title: "Transformers" },
    { id: "machines", title: "Motors and Generators" },
  ] },
  { id: "electromagnetics", order: 11, title: "Electromagnetics", examQuestionRange: [4, 6], sections: [
    { id: "fields", title: "Electric and Magnetic Fields" },
    { id: "transmission-lines", title: "Transmission Lines" },
  ] },
  { id: "control-systems", order: 12, title: "Control Systems", examQuestionRange: [6, 9], sections: [
    { id: "feedback", title: "Feedback" },
    { id: "stability", title: "Stability" },
  ] },
  { id: "communications", order: 13, title: "Communications", examQuestionRange: [5, 8], sections: [
    { id: "modulation", title: "Modulation" },
    { id: "noise", title: "Noise and Bandwidth" },
  ] },
  { id: "computer-networks", order: 14, title: "Computer Networks", examQuestionRange: [3, 5], sections: [
    { id: "protocols", title: "Protocols and Models" },
    { id: "routing", title: "Routing and Switching" },
  ] },
  { id: "digital-systems", order: 15, title: "Digital Systems", examQuestionRange: [7, 11], sections: [
    { id: "logic", title: "Boolean Logic" },
    { id: "sequential", title: "Sequential Circuits" },
  ] },
  { id: "computer-systems", order: 16, title: "Computer Systems", examQuestionRange: [4, 6], sections: [
    { id: "architecture", title: "Computer Architecture" },
    { id: "embedded", title: "Embedded Systems" },
  ] },
  { id: "software", order: 17, title: "Software Development", examQuestionRange: [4, 6], sections: [
    { id: "programming", title: "Programming Concepts" },
    { id: "algorithms", title: "Algorithms and Data Structures" },
  ] },
];

export const feEnvironmentalSubjects: FESubject[] = [
  { id: "math", order: 1, title: "Mathematics", examQuestionRange: [6, 9], sections: [
    { id: "algebra", title: "Algebra" },
    { id: "calculus", title: "Calculus" },
    { id: "statistics", title: "Statistics" },
  ] },
  { id: "ethics", order: 2, title: "Ethics and Professional Practice", examQuestionRange: [4, 6], sections: [
    { id: "codes", title: "Codes of Ethics" },
    { id: "regulatory", title: "Regulatory Responsibility" },
  ] },
  { id: "engineering-economics", order: 3, title: "Engineering Economics", examQuestionRange: [4, 6], sections: [
    { id: "time-value", title: "Time Value of Money" },
    { id: "alternatives", title: "Alternative Comparison" },
  ] },
  { id: "environmental-science", order: 4, title: "Environmental Science and Chemistry", examQuestionRange: [8, 12], sections: [
    { id: "chemistry", title: "Chemistry" },
    { id: "biology", title: "Biology and Ecology" },
    { id: "toxicology", title: "Toxicology" },
  ] },
  { id: "materials-energy-balances", order: 5, title: "Material and Energy Balances", examQuestionRange: [6, 9], sections: [
    { id: "mass-balance", title: "Mass Balances" },
    { id: "energy-balance", title: "Energy Balances" },
  ] },
  { id: "fluid-mechanics", order: 6, title: "Fluid Mechanics", examQuestionRange: [6, 9], sections: [
    { id: "properties", title: "Fluid Properties" },
    { id: "pipe-flow", title: "Pipe Flow" },
    { id: "open-channel", title: "Open-Channel Flow" },
  ] },
  { id: "hydrology", order: 7, title: "Hydrology", examQuestionRange: [7, 11], sections: [
    { id: "precipitation-runoff", title: "Precipitation and Runoff" },
    { id: "groundwater", title: "Groundwater" },
  ] },
  { id: "water-wastewater", order: 8, title: "Water and Wastewater", examQuestionRange: [14, 21], sections: [
    { id: "water-treatment", title: "Water Treatment" },
    { id: "wastewater-treatment", title: "Wastewater Treatment" },
    { id: "disinfection", title: "Disinfection" },
    { id: "solids", title: "Solids Handling" },
  ] },
  { id: "air-quality", order: 9, title: "Air Quality", examQuestionRange: [9, 14], sections: [
    { id: "pollutants", title: "Pollutants" },
    { id: "control", title: "Air Pollution Control" },
    { id: "dispersion", title: "Dispersion" },
  ] },
  { id: "solid-hazardous-waste", order: 10, title: "Solid and Hazardous Waste", examQuestionRange: [9, 14], sections: [
    { id: "solid-waste", title: "Solid Waste Management" },
    { id: "hazardous-waste", title: "Hazardous Waste" },
    { id: "site-remediation", title: "Site Assessment and Remediation" },
  ] },
  { id: "environmental-health-safety", order: 11, title: "Environmental Health and Safety", examQuestionRange: [5, 8], sections: [
    { id: "risk", title: "Risk Assessment" },
    { id: "safety", title: "Safety" },
  ] },
];

export const feChemicalSubjects: FESubject[] = [
  { id: "math", order: 1, title: "Mathematics", examQuestionRange: [8, 12], sections: [
    { id: "algebra", title: "Algebra and Trigonometry" },
    { id: "calculus", title: "Calculus" },
    { id: "differential-equations", title: "Differential Equations" },
  ] },
  { id: "probability-statistics", order: 2, title: "Probability and Statistics", examQuestionRange: [4, 6], sections: [
    { id: "probability", title: "Probability" },
    { id: "statistics", title: "Statistics" },
  ] },
  { id: "ethics", order: 3, title: "Ethics and Professional Practice", examQuestionRange: [4, 6], sections: [
    { id: "codes", title: "Codes of Ethics" },
    { id: "safety", title: "Safety and Responsibility" },
  ] },
  { id: "engineering-economics", order: 4, title: "Engineering Economics", examQuestionRange: [4, 6], sections: [
    { id: "time-value", title: "Time Value of Money" },
    { id: "costs", title: "Cost Estimation" },
  ] },
  { id: "chemical-sciences", order: 5, title: "Chemical Engineering Sciences", examQuestionRange: [8, 12], sections: [
    { id: "chemistry", title: "Chemistry" },
    { id: "materials", title: "Materials Science" },
  ] },
  { id: "material-energy-balances", order: 6, title: "Material and Energy Balances", examQuestionRange: [8, 12], sections: [
    { id: "material-balances", title: "Material Balances" },
    { id: "energy-balances", title: "Energy Balances" },
    { id: "recycle-bypass", title: "Recycle, Bypass, and Purge" },
  ] },
  { id: "thermodynamics", order: 7, title: "Thermodynamics", examQuestionRange: [8, 12], sections: [
    { id: "properties", title: "Properties" },
    { id: "phase-equilibrium", title: "Phase Equilibrium" },
    { id: "chemical-equilibrium", title: "Chemical Equilibrium" },
  ] },
  { id: "fluid-mechanics", order: 8, title: "Fluid Mechanics", examQuestionRange: [8, 12], sections: [
    { id: "fluid-statics", title: "Fluid Statics" },
    { id: "pipe-flow", title: "Pipe Flow" },
    { id: "pumps", title: "Pumps" },
  ] },
  { id: "heat-transfer", order: 9, title: "Heat Transfer", examQuestionRange: [8, 12], sections: [
    { id: "conduction", title: "Conduction" },
    { id: "convection", title: "Convection" },
    { id: "heat-exchangers", title: "Heat Exchangers" },
  ] },
  { id: "mass-transfer", order: 10, title: "Mass Transfer and Separations", examQuestionRange: [8, 12], sections: [
    { id: "diffusion", title: "Diffusion" },
    { id: "distillation", title: "Distillation" },
    { id: "absorption-extraction", title: "Absorption and Extraction" },
  ] },
  { id: "reaction-engineering", order: 11, title: "Chemical Reaction Engineering", examQuestionRange: [8, 12], sections: [
    { id: "kinetics", title: "Reaction Kinetics" },
    { id: "reactors", title: "Reactors" },
  ] },
  { id: "process-design", order: 12, title: "Process Design and Economics", examQuestionRange: [8, 12], sections: [
    { id: "process-flow", title: "Process Flow and Design" },
    { id: "process-economics", title: "Process Economics" },
  ] },
  { id: "process-control", order: 13, title: "Process Control", examQuestionRange: [5, 8], sections: [
    { id: "feedback", title: "Feedback Control" },
    { id: "instrumentation", title: "Instrumentation" },
  ] },
  { id: "safety", order: 14, title: "Safety, Health, and Environment", examQuestionRange: [5, 8], sections: [
    { id: "process-safety", title: "Process Safety" },
    { id: "environmental", title: "Environmental Controls" },
  ] },
];

export const feIndustrialSystemsSubjects: FESubject[] = [
  { id: "math", order: 1, title: "Mathematics", examQuestionRange: [6, 9], sections: [
    { id: "algebra", title: "Algebra" },
    { id: "calculus", title: "Calculus" },
    { id: "linear-algebra", title: "Linear Algebra" },
  ] },
  { id: "probability-statistics", order: 2, title: "Probability and Statistics", examQuestionRange: [12, 18], sections: [
    { id: "probability", title: "Probability" },
    { id: "distributions", title: "Distributions" },
    { id: "hypothesis-tests", title: "Hypothesis Testing" },
    { id: "regression", title: "Regression" },
  ] },
  { id: "ethics", order: 3, title: "Ethics and Professional Practice", examQuestionRange: [4, 6], sections: [
    { id: "codes", title: "Codes of Ethics" },
    { id: "professional-practice", title: "Professional Practice" },
  ] },
  { id: "engineering-economics", order: 4, title: "Engineering Economics", examQuestionRange: [8, 12], sections: [
    { id: "time-value", title: "Time Value of Money" },
    { id: "cost-analysis", title: "Cost Analysis" },
    { id: "depreciation", title: "Depreciation" },
  ] },
  { id: "modeling-computation", order: 5, title: "Modeling and Computation", examQuestionRange: [7, 11], sections: [
    { id: "simulation", title: "Simulation" },
    { id: "optimization", title: "Optimization" },
    { id: "algorithms", title: "Algorithms" },
  ] },
  { id: "industrial-management", order: 6, title: "Industrial Management", examQuestionRange: [6, 9], sections: [
    { id: "project-management", title: "Project Management" },
    { id: "organizational-systems", title: "Organizational Systems" },
  ] },
  { id: "manufacturing", order: 7, title: "Manufacturing, Production, and Service Systems", examQuestionRange: [12, 18], sections: [
    { id: "processes", title: "Manufacturing Processes" },
    { id: "production-systems", title: "Production Systems" },
    { id: "service-systems", title: "Service Systems" },
  ] },
  { id: "facilities-logistics", order: 8, title: "Facilities and Logistics", examQuestionRange: [8, 12], sections: [
    { id: "layout", title: "Facility Layout" },
    { id: "material-handling", title: "Material Handling" },
    { id: "supply-chain", title: "Supply Chain" },
  ] },
  { id: "work-design", order: 9, title: "Human Factors, Ergonomics, and Work Design", examQuestionRange: [7, 11], sections: [
    { id: "ergonomics", title: "Ergonomics" },
    { id: "work-measurement", title: "Work Measurement" },
  ] },
  { id: "quality", order: 10, title: "Quality", examQuestionRange: [10, 15], sections: [
    { id: "spc", title: "Statistical Process Control" },
    { id: "process-capability", title: "Process Capability" },
    { id: "six-sigma", title: "Quality Improvement" },
  ] },
  { id: "systems-engineering", order: 11, title: "Systems Engineering", examQuestionRange: [6, 9], sections: [
    { id: "requirements", title: "Requirements" },
    { id: "reliability", title: "Reliability" },
  ] },
];

export const feOtherDisciplinesSubjects: FESubject[] = [
  { id: "math", order: 1, title: "Mathematics and Advanced Engineering Mathematics", examQuestionRange: [12, 18], sections: [
    { id: "algebra-trig", title: "Algebra and Trigonometry" },
    { id: "calculus", title: "Calculus" },
    { id: "differential-equations", title: "Differential Equations" },
    { id: "linear-algebra", title: "Linear Algebra" },
  ] },
  { id: "probability-statistics", order: 2, title: "Probability and Statistics", examQuestionRange: [6, 9], sections: [
    { id: "probability", title: "Probability" },
    { id: "statistics", title: "Statistics" },
  ] },
  { id: "ethics", order: 3, title: "Ethics and Professional Practice", examQuestionRange: [4, 6], sections: [
    { id: "codes", title: "Codes of Ethics" },
    { id: "licensure", title: "Licensure" },
  ] },
  { id: "engineering-economics", order: 4, title: "Engineering Economics", examQuestionRange: [4, 6], sections: [
    { id: "time-value", title: "Time Value of Money" },
    { id: "economic-analysis", title: "Economic Analysis" },
  ] },
  { id: "statics", order: 5, title: "Statics", examQuestionRange: [8, 12], sections: [
    { id: "force-systems", title: "Force Systems" },
    { id: "equilibrium", title: "Equilibrium" },
    { id: "centroids", title: "Centroids" },
  ] },
  { id: "dynamics", order: 6, title: "Dynamics", examQuestionRange: [6, 9], sections: [
    { id: "kinematics", title: "Kinematics" },
    { id: "kinetics", title: "Kinetics" },
  ] },
  { id: "mechanics-materials", order: 7, title: "Mechanics of Materials", examQuestionRange: [8, 12], sections: [
    { id: "stress-strain", title: "Stress and Strain" },
    { id: "beams", title: "Beams" },
    { id: "torsion", title: "Torsion" },
  ] },
  { id: "materials", order: 8, title: "Materials", examQuestionRange: [6, 9], sections: [
    { id: "properties", title: "Properties" },
    { id: "structure", title: "Structure and Processing" },
  ] },
  { id: "fluid-mechanics", order: 9, title: "Fluid Mechanics", examQuestionRange: [8, 12], sections: [
    { id: "properties", title: "Fluid Properties" },
    { id: "energy", title: "Energy Equation" },
    { id: "flow", title: "Internal and External Flow" },
  ] },
  { id: "thermodynamics", order: 10, title: "Thermodynamics", examQuestionRange: [8, 12], sections: [
    { id: "properties", title: "Properties" },
    { id: "laws", title: "First and Second Laws" },
    { id: "cycles", title: "Cycles" },
  ] },
  { id: "electricity", order: 11, title: "Electricity, Power, and Magnetism", examQuestionRange: [6, 9], sections: [
    { id: "circuits", title: "Circuits" },
    { id: "power", title: "Power" },
    { id: "magnetism", title: "Magnetism" },
  ] },
  { id: "chemistry", order: 12, title: "Chemistry", examQuestionRange: [6, 9], sections: [
    { id: "stoichiometry", title: "Stoichiometry" },
    { id: "reactions", title: "Reactions" },
  ] },
  { id: "instrumentation-controls", order: 13, title: "Instrumentation and Controls", examQuestionRange: [4, 6], sections: [
    { id: "measurement", title: "Measurement" },
    { id: "feedback", title: "Feedback Control" },
  ] },
  { id: "safety-health", order: 14, title: "Safety, Health, and Environment", examQuestionRange: [4, 6], sections: [
    { id: "safety", title: "Safety" },
    { id: "environment", title: "Environmental Topics" },
  ] },
];
