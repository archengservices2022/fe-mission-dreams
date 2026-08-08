import type { FESubject } from "@/types/fe";

type Props = {
  subjects: FESubject[];
  progress?: number;
  onSubjectSelect?: (id: string) => void;
};

export default function StudentDashboard({ subjects, progress = 0, onSubjectSelect }: Props) {
  return (
    <div className="content">
      <section className="card hero">
        <span className="pill">FE MECHANICAL MISSION</span>
        <h2>Welcome Back 👋</h2>
        <p className="sub">
          Continue your FE Mechanical preparation one skill at a time.
        </p>
        <div className="statrow">
          <div className="stat"><b>{progress}%</b>Readiness</div>
          <div className="stat"><b>{subjects.length}</b>Subjects</div>
        </div>
      </section>

      <section className="card">
        <span className="pill">CONTINUE LEARNING</span>
        <h3>MATH-06 Triangle Trigonometry</h3>
        <p className="sub">Next recommended step: continue practice and improve weak skills.</p>
        <button className="primary">Continue Learning</button>
      </section>

      <h2>FE Mechanical Roadmap</h2>
      <div className="grid">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            className="action"
            onClick={() => onSubjectSelect?.(subject.id)}
          >
            <strong>{subject.order.toString().padStart(2, "0")}. {subject.title}</strong>
            <span>{subject.sections.length} learning sections</span>
          </button>
        ))}
      </div>
    </div>
  );
}
