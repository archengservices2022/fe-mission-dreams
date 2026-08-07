export type Flashcard = { front: string; back: string; note: string };
export type Question = {
  id: string;
  skill: string;
  difficulty: "Easy" | "Medium" | "Hard";
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
  trap: string;
  repair: string;
};

export const lessons = [
  { title: "Angle measure", body: "180° = π radians. Convert degrees to radians by multiplying by π/180, and radians to degrees by multiplying by 180/π." },
  { title: "Right triangles", body: "SOH-CAH-TOA connects an angle to opposite, adjacent, and hypotenuse sides. First label the sides relative to the given angle." },
  { title: "Non-right triangles", body: "Use the Law of Sines when you have a known opposite side-angle pair. Use the Law of Cosines for SAS or SSS information." },
  { title: "Engineering components", body: "For a vector F at angle θ measured from the horizontal: Fx = F cos θ and Fy = F sin θ. If the angle is measured from vertical, the adjacent component changes." },
];

export const flashcards: Flashcard[] = [
  { front: "Degrees ↔ radians", back: "180° = π rad", note: "Check calculator angle mode before solving." },
  { front: "Pythagorean theorem", back: "a² + b² = c²", note: "c is the hypotenuse." },
  { front: "Sine", back: "sin θ = opposite / hypotenuse", note: "SOH" },
  { front: "Cosine", back: "cos θ = adjacent / hypotenuse", note: "CAH" },
  { front: "Tangent", back: "tan θ = opposite / adjacent", note: "TOA" },
  { front: "Law of Sines", back: "a/sin A = b/sin B = c/sin C", note: "Pair every side with its opposite angle." },
  { front: "Law of Cosines", back: "c² = a² + b² − 2ab cos C", note: "C is the included angle between a and b." },
  { front: "Triangle area", back: "A = ½ab sin C", note: "C must be the included angle." },
];

export const questions: Question[] = [
  { id:"M06-Q01", skill:"Angle conversion", difficulty:"Easy", prompt:"Convert 60° to radians.", choices:["π/6","π/3","π/2","2π/3"], answer:1, explanation:"60 × π/180 = π/3 rad.", trap:"Using 60/180 without multiplying by π.", repair:"Remember the anchor: 180° = π rad." },
  { id:"M06-Q02", skill:"Pythagorean theorem", difficulty:"Easy", prompt:"A right triangle has legs 6 and 8. What is the hypotenuse?", choices:["9","10","12","14"], answer:1, explanation:"c = √(6²+8²) = √100 = 10.", trap:"Adding the legs instead of adding their squares.", repair:"Square → add → square root." },
  { id:"M06-Q03", skill:"Inverse tangent", difficulty:"Medium", prompt:"A ramp rises 3 ft over a horizontal run of 12 ft. What is its angle above horizontal?", choices:["14.0°","20.6°","36.9°","76.0°"], answer:0, explanation:"tan θ = 3/12 = 0.25, so θ = tan⁻¹(0.25) ≈ 14.0°.", trap:"Using tan(0.25) instead of inverse tangent.", repair:"Unknown angle? Use an inverse trig function." },
  { id:"M06-Q04", skill:"Vector components", difficulty:"Medium", prompt:"A 500 N force acts at 40° above the horizontal. Find the horizontal component.", choices:["321 N","383 N","500 N","642 N"], answer:1, explanation:"Fx = F cos θ = 500 cos 40° ≈ 383 N.", trap:"321 N results from using sine for the horizontal component.", repair:"Angle from horizontal → horizontal is adjacent → cosine." },
  { id:"M06-Q05", skill:"Vector components", difficulty:"Medium", prompt:"A 900 N cable force is 25° from the vertical. Find the vertical component.", choices:["380 N","816 N","900 N","993 N"], answer:1, explanation:"The vertical component is adjacent to the stated angle: Fy = 900 cos 25° ≈ 816 N.", trap:"Automatically using sine for vertical without checking where the angle is measured from.", repair:"Label adjacent/opposite relative to the actual given angle." },
  { id:"M06-Q06", skill:"Law of Sines", difficulty:"Medium", prompt:"In a triangle, A=30°, B=45°, and side a=10. Find side b.", choices:["7.07","10.0","14.14","20.0"], answer:2, explanation:"b/sin45° = 10/sin30°, so b = 10 sin45°/sin30° ≈ 14.14.", trap:"Pairing a side with the wrong angle.", repair:"Side a is always opposite angle A; side b is opposite B." },
  { id:"M06-Q07", skill:"Law of Cosines", difficulty:"Medium", prompt:"Two sides are 8 and 11 with an included angle of 60°. Find the opposite side.", choices:["7.00","9.85","13.60","19.00"], answer:1, explanation:"c²=8²+11²−2(8)(11)cos60°=97, so c≈9.85.", trap:"Adding the cosine term instead of subtracting it.", repair:"Law of Cosines contains −2ab cos C." },
  { id:"M06-Q08", skill:"Triangle area", difficulty:"Easy", prompt:"Two sides are 8 and 12 with an included angle of 30°. Find the area.", choices:["12","24","48","96"], answer:1, explanation:"A=½(8)(12)sin30°=24.", trap:"Forgetting the ½ factor.", repair:"Area with two sides and included angle: ½ab sin C." },
  { id:"M06-Q09", skill:"Calculator mode", difficulty:"Easy", prompt:"You expect tan⁻¹(1)=45°, but your calculator displays about 0.785. What is the likely issue?", choices:["Wrong trig function","Calculator is in radians","Calculator is in degrees","Rounding error"], answer:1, explanation:"0.785 is approximately π/4 radians, which equals 45°.", trap:"Treating a correct radian result as a calculation error.", repair:"Always confirm DEG or RAD before an FE trig calculation." },
  { id:"M06-Q10", skill:"Mixed engineering", difficulty:"Hard", prompt:"A 2.0 kN force has horizontal component 1.2 kN. If the force points upward and right, what is its vertical component?", choices:["0.8 kN","1.2 kN","1.6 kN","2.4 kN"], answer:2, explanation:"Fy=√(F²−Fx²)=√(2.0²−1.2²)=√2.56=1.6 kN.", trap:"Subtracting components directly rather than using the right-triangle relationship.", repair:"Orthogonal components satisfy F² = Fx² + Fy²." },
];
