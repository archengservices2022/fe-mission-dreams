import type { StudyModule } from "../module-types";

const surveyingAnglesModule: StudyModule = {
  id: "CIV-SUR-01",
  subjectId: "surveying",
  sectionId: "angles-distances",
  title: "Angles, Distances, and Grades",
  lessons: [
    { title: "Bearings and azimuths", body: "Surveying direction problems usually use bearings or azimuths. Azimuths are clockwise angles from north from 0 to 360 degrees. Bearings use a quadrant format such as N 35 E or S 20 W, so always identify the quadrant before resolving components." },
    { title: "Distance components", body: "Horizontal distance components follow ordinary trigonometry. For an azimuth theta measured clockwise from north, northing is L cos(theta) and easting is L sin(theta), with signs based on the quadrant." },
    { title: "Percent grade", body: "Percent grade is vertical rise divided by horizontal run times 100. A 3 percent grade means 3 ft of elevation change per 100 ft of horizontal distance, not per sloped distance." },
  ],
  flashcards: [
    { front: "Azimuth", back: "Clockwise angle from north", note: "Range is 0 to 360 degrees." },
    { front: "Northing component", back: "N = L cos(theta)", note: "For azimuth theta from north; apply the quadrant sign." },
    { front: "Easting component", back: "E = L sin(theta)", note: "For azimuth theta from north; apply the quadrant sign." },
    { front: "Percent grade", back: "grade = rise/run * 100", note: "Use horizontal run in the denominator." },
  ],
  questions: [
    { id: "CIV-SUR01-Q01", skill: "Percent grade", difficulty: "Easy", prompt: "A road rises 6 ft over a horizontal distance of 200 ft. Find the percent grade.", choices: ["1.5%", "3.0%", "6.0%", "33.3%"], answer: 1, explanation: "The grade is 3.0%.", solution: "Step 1 - grade = rise/run * 100.\nStep 2 - grade = 6/200 * 100.\nStep 3 - grade = 3.0%.", trap: "Using the rise alone gives 6%, but grade is rise divided by horizontal run.", repair: "Always divide vertical change by horizontal distance, then multiply by 100.", formulaUsed: "grade = rise/run * 100", estimatedSolvingTimeSeconds: 60, commonMistakes: ["Wrong formula", "Misread question"], handbookKeywords: ["grade", "surveying", "elevation"] },
    { id: "CIV-SUR01-Q02", skill: "Azimuth components", difficulty: "Medium", prompt: "A survey line is 500 ft long with azimuth 60 degrees. Find the east component.", choices: ["250 ft", "433 ft", "500 ft", "866 ft"], answer: 1, explanation: "For azimuth from north, easting is L sin(theta), so the east component is about 433 ft.", solution: "Step 1 - Use E = L sin(theta).\nStep 2 - E = 500 sin(60 degrees).\nStep 3 - E = 500(0.866) = 433 ft.", trap: "250 ft comes from using cosine for the east component when azimuth is measured from north.", repair: "For azimuths measured from north, northing uses cosine and easting uses sine.", formulaUsed: "E = L sin(theta)", estimatedSolvingTimeSeconds: 90, commonMistakes: ["Wrong formula", "Calculator error"], handbookKeywords: ["azimuth", "components", "surveying"] },
    { id: "CIV-SUR01-Q03", skill: "Northing component", difficulty: "Medium", prompt: "A 300 ft line has azimuth 120 degrees. What is the northing component?", choices: ["150 ft north", "150 ft south", "260 ft east", "300 ft south"], answer: 1, explanation: "cos(120 degrees) is negative, so the northing is 150 ft south.", solution: "Step 1 - N = L cos(theta).\nStep 2 - N = 300 cos(120 degrees) = 300(-0.5) = -150 ft.\nStep 3 - Negative northing means south.", trap: "Reporting 150 ft north ignores the quadrant sign.", repair: "Keep the sign of the trig result; negative northing means south.", formulaUsed: "N = L cos(theta)", estimatedSolvingTimeSeconds: 95, commonMistakes: ["Concept misunderstanding", "Calculator error"], handbookKeywords: ["azimuth", "northing", "surveying"] },
  ],
};

const waterHydrologyModule: StudyModule = {
  id: "CIV-WRE-01",
  subjectId: "water-environmental",
  sectionId: "hydrology",
  title: "Basic Hydrology",
  lessons: [
    { title: "Runoff coefficient method", body: "The rational method estimates peak runoff as Q = C i A. In U.S. customary FE-style problems, Q is in cfs when rainfall intensity i is in in/hr and area A is in acres." },
    { title: "Watershed response", body: "Higher runoff coefficient, higher rainfall intensity, and larger drainage area all increase peak discharge. Impervious urban areas have larger C values than wooded or undeveloped areas." },
    { title: "Unit awareness", body: "Civil water problems often use both SI and U.S. Customary units. Check whether the formula has an embedded conversion, such as the rational method in cfs with in/hr and acres." },
  ],
  flashcards: [
    { front: "Rational method", back: "Q = C i A", note: "Q in cfs when i is in in/hr and A is in acres." },
    { front: "Runoff coefficient", back: "C = runoff fraction", note: "Higher for impervious surfaces." },
    { front: "Peak discharge drivers", back: "Q increases with C, i, and A", note: "All three multiply directly." },
  ],
  questions: [
    { id: "CIV-WRE01-Q01", skill: "Rational method", difficulty: "Easy", prompt: "Using the rational method, estimate peak runoff for C=0.60, rainfall intensity i=3 in/hr, and drainage area A=20 acres.", choices: ["18 cfs", "36 cfs", "60 cfs", "100 cfs"], answer: 1, explanation: "The peak runoff is 36 cfs.", solution: "Step 1 - Q = C i A.\nStep 2 - Q = 0.60(3)(20).\nStep 3 - Q = 36 cfs.", trap: "18 cfs comes from forgetting to multiply by the full 20 acres.", repair: "Use all three rational method factors: C, i, and A.", formulaUsed: "Q = C i A", estimatedSolvingTimeSeconds: 70, commonMistakes: ["Wrong formula", "Arithmetic error"], handbookKeywords: ["rational method", "runoff", "hydrology"] },
    { id: "CIV-WRE01-Q02", skill: "Runoff coefficient", difficulty: "Medium", prompt: "Two watersheds have the same rainfall intensity and area. Watershed A has C=0.25 and Watershed B has C=0.75. How does peak runoff from B compare with A?", choices: ["B is one-third of A", "B is the same as A", "B is three times A", "B is nine times A"], answer: 2, explanation: "Since Q is proportional to C, B has 0.75/0.25 = 3 times the peak runoff.", solution: "Step 1 - With i and A fixed, Q is directly proportional to C.\nStep 2 - Ratio = C_B/C_A = 0.75/0.25 = 3.\nFinal answer: B is three times A.", trap: "Nine times comes from squaring the runoff coefficient ratio even though C enters linearly.", repair: "The rational method is linear in C, i, and A.", formulaUsed: "Q_B/Q_A = C_B/C_A", estimatedSolvingTimeSeconds: 75, commonMistakes: ["Concept misunderstanding", "Wrong formula"], handbookKeywords: ["runoff coefficient", "rational method"] },
    { id: "CIV-WRE01-Q03", skill: "Unit check", difficulty: "Medium", prompt: "In the common U.S. customary rational method form Q=C i A, what units are used for rainfall intensity and area to produce Q in cfs?", choices: ["ft/s and ft^2", "in/hr and acres", "in/day and square miles", "gal/min and acres"], answer: 1, explanation: "The common civil FE form uses i in in/hr and A in acres to produce Q in cfs.", solution: "Step 1 - Recall the U.S. customary rational method convention.\nStep 2 - Q in cfs pairs with rainfall intensity in in/hr and area in acres.\nFinal answer: in/hr and acres.", trap: "ft/s and ft^2 is dimensionally familiar, but not the standard rational-method civil shortcut form.", repair: "Memorize the unit convention attached to the FE rational method form.", formulaUsed: "Q = C i A", estimatedSolvingTimeSeconds: 60, commonMistakes: ["Unit conversion", "Misread question"], handbookKeywords: ["units", "rational method", "hydrology"] },
  ],
};

const civilModules: StudyModule[] = [surveyingAnglesModule, waterHydrologyModule];

export const civilModuleRegistry: Record<string, StudyModule> = Object.fromEntries(
  civilModules.map((module) => [`${module.subjectId}:${module.sectionId}`, module]),
);
