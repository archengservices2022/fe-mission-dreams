import type { FESubject } from "@/types/fe";

// FE Mechanical production curriculum catalog. Question ranges are used for planning coverage,
// not as a promise of the exact questions a candidate will receive.
export const feMechanicalSubjects: FESubject[] = [
  { id:"math",order:1,title:"Mathematics",examQuestionRange:[6,9],sections:[
    {id:"analytic-geometry",title:"Analytic Geometry"},{id:"trigonometry",title:"Trigonometry"},{id:"calculus",title:"Calculus"},{id:"differential-equations",title:"Differential Equations"},{id:"linear-algebra",title:"Linear Algebra"}
  ]},
  { id:"probability-statistics",order:2,title:"Probability and Statistics",examQuestionRange:[4,6],sections:[
    {id:"probability",title:"Probability"},{id:"distributions",title:"Distributions"},{id:"descriptive-statistics",title:"Descriptive Statistics"},{id:"regression",title:"Regression and Curve Fitting"}
  ]},
  { id:"ethics",order:3,title:"Ethics and Professional Practice",examQuestionRange:[4,6],sections:[
    {id:"codes",title:"Codes of Ethics"},{id:"professional-liability",title:"Professional Liability"},{id:"public-safety",title:"Public Safety and Responsibility"}
  ]},
  { id:"engineering-economics",order:4,title:"Engineering Economics",examQuestionRange:[4,6],sections:[
    {id:"time-value",title:"Time Value of Money"},{id:"economic-analysis",title:"Economic Analysis"},{id:"costs",title:"Cost Estimation and Comparison"}
  ]},
  { id:"electricity-magnetism",order:5,title:"Electricity and Magnetism",examQuestionRange:[5,8],sections:[
    {id:"circuits",title:"DC/AC Circuit Fundamentals"},{id:"power",title:"Electrical Power"},{id:"motors",title:"Motors and Machines"},{id:"instrumentation",title:"Basic Instrumentation"}
  ]},
  { id:"statics",order:6,title:"Statics",examQuestionRange:[9,14],sections:[
    {id:"force-systems",title:"Force Systems"},{id:"equilibrium",title:"Equilibrium"},{id:"structures",title:"Trusses, Frames, and Machines"},{id:"friction",title:"Friction"},{id:"centroids",title:"Centroids and Area Moments"}
  ]},
  { id:"dynamics",order:7,title:"Dynamics, Kinematics, and Vibrations",examQuestionRange:[10,15],sections:[
    {id:"particle-kinematics",title:"Particle Kinematics"},{id:"particle-kinetics",title:"Particle Kinetics"},{id:"rigid-body",title:"Rigid-Body Motion"},{id:"energy-momentum",title:"Work, Energy, Impulse, and Momentum"},{id:"vibrations",title:"Mechanical Vibrations"}
  ]},
  { id:"mechanics-materials",order:8,title:"Mechanics of Materials",examQuestionRange:[9,14],sections:[
    {id:"stress-strain",title:"Stress and Strain"},{id:"axial-torsion",title:"Axial Loading and Torsion"},{id:"beams",title:"Beams: Shear, Moment, and Deflection"},{id:"combined-loading",title:"Combined Loading and Stress Transformation"},{id:"columns",title:"Columns and Stability"}
  ]},
  { id:"materials",order:9,title:"Material Properties and Processing",examQuestionRange:[6,9],sections:[
    {id:"properties",title:"Material Properties"},{id:"phase-diagrams",title:"Phase Diagrams and Heat Treatment"},{id:"manufacturing",title:"Manufacturing Processes"},{id:"failure",title:"Failure and Material Selection"}
  ]},
  { id:"fluid-mechanics",order:10,title:"Fluid Mechanics",examQuestionRange:[10,15],sections:[
    {id:"fluid-properties",title:"Fluid Properties and Statics"},{id:"continuity",title:"Continuity and Control Volumes"},{id:"energy",title:"Bernoulli and Energy Equation"},{id:"momentum",title:"Momentum Analysis"},{id:"internal-flow",title:"Internal Flow and Losses"},{id:"pumps",title:"Pumps and Fluid Machinery"}
  ]},
  { id:"thermodynamics",order:11,title:"Thermodynamics",examQuestionRange:[10,15],sections:[
    {id:"properties",title:"Properties and State Relations"},{id:"first-law",title:"First Law and Energy Balances"},{id:"second-law",title:"Second Law and Entropy"},{id:"cycles",title:"Power and Refrigeration Cycles"},{id:"mixtures",title:"Gas Mixtures and Psychrometrics"}
  ]},
  { id:"heat-transfer",order:12,title:"Heat Transfer",examQuestionRange:[7,11],sections:[
    {id:"conduction",title:"Conduction"},{id:"convection",title:"Convection"},{id:"radiation",title:"Radiation"},{id:"heat-exchangers",title:"Heat Exchangers"}
  ]},
  { id:"measurements-controls",order:13,title:"Measurements, Instrumentation, and Controls",examQuestionRange:[5,8],sections:[
    {id:"measurement",title:"Measurement Systems"},{id:"uncertainty",title:"Uncertainty and Data Acquisition"},{id:"control",title:"Feedback and Control Systems"}
  ]},
  { id:"mechanical-design",order:14,title:"Mechanical Design and Analysis",examQuestionRange:[10,15],sections:[
    {id:"failure-theories",title:"Failure Theories and Safety Factors"},{id:"machine-elements",title:"Machine Elements"},{id:"power-transmission",title:"Power Transmission"},{id:"springs",title:"Springs"},{id:"fatigue",title:"Fatigue"},{id:"design-integration",title:"Design Integration"}
  ]}
];

export const totalPlannedSections = feMechanicalSubjects.reduce((sum,subject)=>sum+subject.sections.length,0);
