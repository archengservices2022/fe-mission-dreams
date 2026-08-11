import type { FESubject } from "@/types/fe";

// FE Civil CBT catalog based on the current NCEES FE Civil specification.
// Question ranges are used for planning coverage, not as a promise of exact exam distribution.
export const feCivilSubjects: FESubject[] = [
  { id: "math-statistics", order: 1, title: "Mathematics and Statistics", examQuestionRange: [8, 12], sections: [
    { id: "analytic-geometry", title: "Analytic Geometry" },
    { id: "calculus", title: "Single-Variable Calculus" },
    { id: "vectors", title: "Vector Operations" },
    { id: "statistics", title: "Statistics and Regression" },
  ] },
  { id: "ethics", order: 2, title: "Ethics and Professional Practice", examQuestionRange: [4, 6], sections: [
    { id: "codes", title: "Codes of Ethics" },
    { id: "professional-liability", title: "Professional Liability" },
    { id: "licensure", title: "Licensure" },
    { id: "contracts", title: "Contracts and Contract Law" },
  ] },
  { id: "engineering-economics", order: 3, title: "Engineering Economics", examQuestionRange: [5, 8], sections: [
    { id: "time-value", title: "Time Value of Money" },
    { id: "costs", title: "Costs" },
    { id: "economic-analysis", title: "Economic Analysis" },
    { id: "uncertainty", title: "Uncertainty and Risk" },
  ] },
  { id: "statics", order: 4, title: "Statics", examQuestionRange: [8, 12], sections: [
    { id: "force-systems", title: "Resultants and Equivalent Force Systems" },
    { id: "equilibrium", title: "Equilibrium of Rigid Bodies" },
    { id: "structures", title: "Frames and Trusses" },
    { id: "centroids", title: "Centroids and Area Moments of Inertia" },
    { id: "friction", title: "Static Friction" },
  ] },
  { id: "dynamics", order: 5, title: "Dynamics", examQuestionRange: [4, 6], sections: [
    { id: "kinematics", title: "Kinematics" },
    { id: "mass-moments", title: "Mass Moments of Inertia" },
    { id: "force-acceleration", title: "Force and Acceleration" },
    { id: "work-energy-power", title: "Work, Energy, and Power" },
  ] },
  { id: "mechanics-materials", order: 6, title: "Mechanics of Materials", examQuestionRange: [7, 11], sections: [
    { id: "shear-moment", title: "Shear and Moment Diagrams" },
    { id: "stress-strain", title: "Stresses and Strains" },
    { id: "deformations", title: "Deformations" },
    { id: "combined-stress", title: "Combined Stress and Mohr's Circle" },
  ] },
  { id: "materials", order: 7, title: "Materials", examQuestionRange: [5, 8], sections: [
    { id: "mix-design", title: "Concrete and Asphalt Mix Design" },
    { id: "testing-specifications", title: "Test Methods and Specifications" },
    { id: "properties", title: "Physical and Mechanical Properties" },
  ] },
  { id: "fluid-mechanics", order: 8, title: "Fluid Mechanics", examQuestionRange: [6, 9], sections: [
    { id: "flow-measurement", title: "Flow Measurement" },
    { id: "fluid-properties", title: "Fluid Properties" },
    { id: "fluid-statics", title: "Fluid Statics" },
    { id: "energy-momentum", title: "Energy, Impulse, and Momentum" },
  ] },
  { id: "surveying", order: 9, title: "Surveying", examQuestionRange: [6, 9], sections: [
    { id: "angles-distances", title: "Angles, Distances, and Trigonometry" },
    { id: "areas", title: "Area Computations" },
    { id: "earthwork", title: "Earthwork and Volumes" },
    { id: "coordinates", title: "Coordinate Systems" },
    { id: "leveling", title: "Leveling, Elevations, and Grades" },
  ] },
  { id: "water-environmental", order: 10, title: "Water Resources and Environmental Engineering", examQuestionRange: [10, 15], sections: [
    { id: "hydrology", title: "Basic Hydrology" },
    { id: "hydraulics", title: "Basic Hydraulics and Open Channel Flow" },
    { id: "pumps", title: "Pumps" },
    { id: "water-distribution", title: "Water Distribution Systems" },
    { id: "stormwater", title: "Stormwater and Flood Control" },
    { id: "groundwater", title: "Groundwater" },
    { id: "water-quality", title: "Water Quality and Treatment" },
  ] },
  { id: "structural", order: 11, title: "Structural Engineering", examQuestionRange: [10, 15], sections: [
    { id: "analysis", title: "Beam, Column, Truss, and Frame Analysis" },
    { id: "deflection", title: "Deflection" },
    { id: "columns", title: "Column Analysis" },
    { id: "determinacy-stability", title: "Determinacy and Stability" },
    { id: "loads", title: "Loads, Load Paths, and Tributary Areas" },
    { id: "steel", title: "Steel Components" },
    { id: "concrete", title: "Reinforced Concrete Components" },
  ] },
  { id: "geotechnical", order: 12, title: "Geotechnical Engineering", examQuestionRange: [10, 15], sections: [
    { id: "soil-classification", title: "Index Properties and Soil Classification" },
    { id: "phase-relations", title: "Phase Relations" },
    { id: "testing", title: "Laboratory and Field Tests" },
    { id: "effective-stress", title: "Effective Stress" },
    { id: "retaining-structures", title: "Retaining Structures" },
    { id: "shear-strength", title: "Shear Strength" },
    { id: "bearing-capacity", title: "Bearing Capacity" },
    { id: "foundations", title: "Foundation Types" },
    { id: "settlement", title: "Consolidation and Settlement" },
    { id: "slope-stability", title: "Slope Stability" },
    { id: "soil-stabilization", title: "Soil Stabilization" },
  ] },
  { id: "transportation", order: 13, title: "Transportation Engineering", examQuestionRange: [9, 14], sections: [
    { id: "geometric-design", title: "Geometric Design" },
    { id: "pavements", title: "Pavement System Design" },
    { id: "traffic-flow", title: "Traffic Capacity and Flow Theory" },
    { id: "traffic-control", title: "Traffic Control Devices" },
    { id: "planning-safety", title: "Transportation Planning and Safety" },
  ] },
  { id: "construction", order: 14, title: "Construction Engineering", examQuestionRange: [8, 12], sections: [
    { id: "project-administration", title: "Project Administration" },
    { id: "operations-methods", title: "Construction Operations and Methods" },
    { id: "project-controls", title: "Project Controls and Scheduling" },
    { id: "estimating", title: "Construction Estimating" },
    { id: "drawings", title: "Engineering Drawings" },
  ] },
];

export const totalCivilPlannedSections = feCivilSubjects.reduce((sum, subject) => sum + subject.sections.length, 0);
