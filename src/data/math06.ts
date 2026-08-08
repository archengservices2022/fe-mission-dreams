export type Flashcard = { front: string; back: string; note: string };
export type Question = {
  id:string; skill:string; difficulty:"Easy"|"Medium"|"Hard"; prompt:string; choices:string[]; answer:number;
  explanation:string; solution:string; trap:string; repair:string;
};

export const lessons=[
{title:"Angle measure",body:"180° = π radians. Convert degrees to radians by multiplying by π/180, and radians to degrees by multiplying by 180/π."},
{title:"Right triangles",body:"SOH-CAH-TOA connects an angle to opposite, adjacent, and hypotenuse sides. First label the sides relative to the given angle."},
{title:"Non-right triangles",body:"Use the Law of Sines when you have a known opposite side-angle pair. Use the Law of Cosines for SAS or SSS information."},
{title:"Engineering components",body:"For a vector F at angle θ measured from horizontal: Fx=F cosθ and Fy=F sinθ. If measured from vertical, identify adjacent/opposite from the sketch first."}
];

export const flashcards:Flashcard[]=[
{front:"Degrees ↔ radians",back:"180° = π rad",note:"Check calculator angle mode before solving."},
{front:"Pythagorean theorem",back:"a²+b²=c²",note:"c is the hypotenuse."},
{front:"Sine",back:"sinθ=opposite/hypotenuse",note:"SOH"},
{front:"Cosine",back:"cosθ=adjacent/hypotenuse",note:"CAH"},
{front:"Tangent",back:"tanθ=opposite/adjacent",note:"TOA"},
{front:"Law of Sines",back:"a/sinA=b/sinB=c/sinC",note:"Pair every side with its opposite angle."},
{front:"Law of Cosines",back:"c²=a²+b²−2ab cosC",note:"C is the included angle between a and b."},
{front:"Triangle area",back:"A=½ab sinC",note:"C must be the included angle."}
];

export const questions:Question[]=[
{id:"M06-Q01",skill:"Angle conversion",difficulty:"Easy",prompt:"Convert 60° to radians.",choices:["π/6","π/3","π/2","2π/3"],answer:1,explanation:"60° equals π/3 rad.",solution:"Step 1 — Use the conversion factor: radians = degrees × π/180.\nStep 2 — Substitute: 60 × π/180.\nStep 3 — Simplify 60/180 = 1/3.\nFinal answer: π/3 rad.",trap:"Using 60/180 without multiplying by π.",repair:"Remember the anchor: 180°=π rad."},
{id:"M06-Q02",skill:"Pythagorean theorem",difficulty:"Easy",prompt:"A right triangle has legs 6 and 8. What is the hypotenuse?",choices:["9","10","12","14"],answer:1,explanation:"The hypotenuse is 10.",solution:"Step 1 — Use a²+b²=c².\nStep 2 — Substitute: 6²+8²=c².\nStep 3 — 36+64=100, so c²=100.\nStep 4 — c=√100.\nFinal answer: 10.",trap:"Adding the legs instead of adding their squares.",repair:"Square → add → square root."},
{id:"M06-Q03",skill:"Inverse tangent",difficulty:"Medium",prompt:"A ramp rises 3 ft over a horizontal run of 12 ft. What is its angle above horizontal?",choices:["14.0°","20.6°","36.9°","76.0°"],answer:0,explanation:"The ramp angle is about 14.0°.",solution:"Step 1 — Relative to the angle, rise=opposite=3 and run=adjacent=12.\nStep 2 — tanθ=opposite/adjacent=3/12=0.25.\nStep 3 — θ=tan⁻¹(0.25).\nStep 4 — In degree mode, θ≈14.0°.\nFinal answer: 14.0°.",trap:"Using tan(0.25) instead of inverse tangent.",repair:"Unknown angle? Use an inverse trig function."},
{id:"M06-Q04",skill:"Vector components",difficulty:"Medium",prompt:"A 500 N force acts at 40° above the horizontal. Find the horizontal component.",choices:["321 N","383 N","500 N","642 N"],answer:1,explanation:"The horizontal component is about 383 N.",solution:"Step 1 — The angle is measured from horizontal, so the horizontal component is adjacent.\nStep 2 — Use Fx=F cosθ.\nStep 3 — Fx=500 cos40°.\nStep 4 — cos40°≈0.7660.\nStep 5 — Fx≈500(0.7660)=383 N.\nFinal answer: 383 N.",trap:"321 N results from using sine for the horizontal component.",repair:"Angle from horizontal → horizontal is adjacent → cosine."},
{id:"M06-Q05",skill:"Vector components",difficulty:"Medium",prompt:"A 900 N cable force is 25° from the vertical. Find the vertical component.",choices:["380 N","816 N","900 N","993 N"],answer:1,explanation:"The vertical component is about 816 N.",solution:"Step 1 — The 25° angle is measured from vertical.\nStep 2 — Vertical is therefore the adjacent component.\nStep 3 — Fy=900 cos25°.\nStep 4 — cos25°≈0.9063.\nStep 5 — Fy≈900(0.9063)=816 N.\nFinal answer: 816 N.",trap:"Automatically using sine for vertical without checking where the angle is measured from.",repair:"Label adjacent/opposite relative to the actual given angle."},
{id:"M06-Q06",skill:"Law of Sines",difficulty:"Medium",prompt:"In a triangle, A=30°, B=45°, and side a=10. Find side b.",choices:["7.07","10.0","14.14","20.0"],answer:2,explanation:"Side b is about 14.14.",solution:"Step 1 — Use the Law of Sines: a/sinA=b/sinB.\nStep 2 — Substitute: 10/sin30°=b/sin45°.\nStep 3 — Solve for b: b=10 sin45°/sin30°.\nStep 4 — b=10(0.7071)/(0.5)=14.14.\nFinal answer: 14.14.",trap:"Pairing a side with the wrong angle.",repair:"Side a is opposite A; side b is opposite B."},
{id:"M06-Q07",skill:"Law of Cosines",difficulty:"Medium",prompt:"Two sides are 8 and 11 with an included angle of 60°. Find the opposite side.",choices:["7.00","9.85","13.60","19.00"],answer:1,explanation:"The opposite side is about 9.85.",solution:"Step 1 — SAS information calls for the Law of Cosines.\nStep 2 — c²=a²+b²−2ab cosC.\nStep 3 — c²=8²+11²−2(8)(11)cos60°.\nStep 4 — c²=64+121−176(0.5)=97.\nStep 5 — c=√97≈9.85.\nFinal answer: 9.85.",trap:"Adding the cosine term instead of subtracting it.",repair:"Law of Cosines contains −2ab cosC."},
{id:"M06-Q08",skill:"Triangle area",difficulty:"Easy",prompt:"Two sides are 8 and 12 with an included angle of 30°. Find the area.",choices:["12","24","48","96"],answer:1,explanation:"The area is 24 square units.",solution:"Step 1 — Use A=½ab sinC.\nStep 2 — Substitute: A=½(8)(12)sin30°.\nStep 3 — sin30°=0.5.\nStep 4 — A=0.5×8×12×0.5=24.\nFinal answer: 24 square units.",trap:"Forgetting the ½ factor.",repair:"Area with two sides and included angle: ½ab sinC."},
{id:"M06-Q09",skill:"Calculator mode",difficulty:"Easy",prompt:"You expect tan⁻¹(1)=45°, but your calculator displays about 0.785. What is the likely issue?",choices:["Wrong trig function","Calculator is in radians","Calculator is in degrees","Rounding error"],answer:1,explanation:"0.785 is the radian value of 45°.",solution:"Step 1 — Recognize that π/4≈0.7854 rad.\nStep 2 — Convert to degrees: (π/4)(180/π)=45°.\nStep 3 — The numerical result is correct, but the calculator is displaying radians.\nFinal answer: Calculator is in radians.",trap:"Treating a correct radian result as a calculation error.",repair:"Always confirm DEG or RAD before an FE trig calculation."},
{id:"M06-Q10",skill:"Mixed engineering",difficulty:"Hard",prompt:"A 2.0 kN force has horizontal component 1.2 kN. If the force points upward and right, what is its vertical component?",choices:["0.8 kN","1.2 kN","1.6 kN","2.4 kN"],answer:2,explanation:"The vertical component is 1.6 kN.",solution:"Step 1 — Orthogonal components form a right triangle.\nStep 2 — Use F²=Fx²+Fy².\nStep 3 — Fy=√(F²−Fx²).\nStep 4 — Fy=√(2.0²−1.2²)=√(4.00−1.44).\nStep 5 — Fy=√2.56=1.6 kN.\nFinal answer: 1.6 kN upward.",trap:"Subtracting components directly rather than using the right-triangle relationship.",repair:"Orthogonal components satisfy F²=Fx²+Fy²."}
];
