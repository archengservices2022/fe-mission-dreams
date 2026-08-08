type Props = {
  module: string;
  section: string;
  progress: number;
};

export default function ContinueLearningCard({ module, section, progress }: Props) {
  return (
    <section className="card">
      <span className="pill">CONTINUE LEARNING</span>
      <h2>{module}</h2>
      <p className="sub">Current section: {section}</p>
      <div className="progress">
        <div style={{ width: `${progress}%` }} />
      </div>
      <p className="note">{progress}% complete</p>
      <button className="primary">Continue</button>
    </section>
  );
}
